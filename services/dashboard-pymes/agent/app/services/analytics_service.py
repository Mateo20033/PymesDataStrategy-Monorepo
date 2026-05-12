"""
analytics_service.py
Motor de análisis estadístico avanzado con scikit-learn, pandas y numpy.
"""
import json
import re
import numpy as np
import pandas as pd
import psycopg2
import psycopg2.extras
from typing import Optional
from app.config import settings

# ── BD ────────────────────────────────────────────────────────────────────────

def _get_conn():
    return psycopg2.connect(
        host=settings.DB_HOST, port=settings.DB_PORT,
        dbname=settings.DB_NAME, user=settings.DB_USER,
        password=settings.DB_PASSWORD, connect_timeout=5,
    )


def _get_filas(dataset_id: int) -> tuple[list[dict], list[str]]:
    conn = _get_conn()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT columnas FROM datasets WHERE id = %s", (dataset_id,))
    row  = cur.fetchone()
    if not row:
        raise ValueError(f"Dataset {dataset_id} no encontrado")
    raw = row["columnas"]
    columnas = json.loads(raw) if isinstance(raw, str) else (raw or [])
    cur.execute(
        "SELECT datos FROM registros_datos WHERE dataset_id = %s ORDER BY fila_numero",
        (dataset_id,),
    )
    filas = [r["datos"] for r in cur.fetchall()]
    cur.close(); conn.close()
    return filas, columnas


# ── DataFrame helpers ─────────────────────────────────────────────────────────

_ID_WORDS = {"id", "nit", "code", "cod", "codigo", "cedula", "dni", "pk", "fk", "ref"}
_DATE_KEYS = ["fecha", "date", "periodo", "mes", "month"]


def _a_df(filas: list[dict], columnas: list[str]) -> pd.DataFrame:
    df = pd.DataFrame(filas, columns=columnas) if filas else pd.DataFrame(columns=columnas)
    for col in columnas:
        # Preserve date columns as strings so _monthly() can parse them correctly
        if any(k in col.lower() for k in _DATE_KEYS):
            continue
        try:
            df[col] = pd.to_numeric(df[col].astype(str).str.replace(",", "."), errors="coerce")
        except Exception:
            pass
    return df


def _es_fecha(col: str, serie: pd.Series) -> bool:
    if any(k in col.lower() for k in _DATE_KEYS):
        return True
    sample = serie.dropna().astype(str).head(15)
    hits = sum(
        1 for v in sample
        if (len(v) >= 8 and (v[4:5] in "-/" or v[2:3] in "-/"))
    )
    return hits >= len(sample) * 0.6 and len(sample) > 0


def _num_cols(df: pd.DataFrame) -> list[str]:
    cols = []
    for col in df.columns:
        palabras = set(re.split(r"[_\-\s]", col.lower()))
        if palabras & _ID_WORDS:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            vals = df[col].dropna()
            if len(vals) >= 3 and not all(1900 <= v <= 2100 for v in vals):
                cols.append(col)
    return cols


def _detectar_fecha_col(df: pd.DataFrame, columnas: list[str]) -> Optional[str]:
    for col in columnas:
        if col in df.columns and _es_fecha(col, df[col]):
            return col
    return None


def _monthly(df: pd.DataFrame, col_fecha: str, col_val: str) -> pd.DataFrame:
    tmp = df.copy()
    tmp["_f"] = pd.to_datetime(tmp[col_fecha].astype(str), errors="coerce", dayfirst=False)
    tmp = tmp.dropna(subset=["_f", col_val]).sort_values("_f")
    tmp["_mes"] = tmp["_f"].dt.to_period("M")
    m = tmp.groupby("_mes")[col_val].sum().reset_index()
    m["label"] = m["_mes"].astype(str)
    m["val"]   = m[col_val].astype(float)
    return m


# ══════════════════════════════════════════════════════════════════════════════
# 1. REGRESIÓN LINEAL
# ══════════════════════════════════════════════════════════════════════════════

def analizar_regresion(filas: list[dict], columnas: list[str]) -> dict:
    from sklearn.linear_model import LinearRegression

    df       = _a_df(filas, columnas)
    n_cols   = _num_cols(df)
    col_fecha = _detectar_fecha_col(df, columnas)

    if not n_cols:
        return {"error": "No se encontraron columnas numéricas para regresión"}

    col_target = n_cols[0]

    if col_fecha:
        m = _monthly(df, col_fecha, col_target)
        if len(m) < 3:
            return {"error": "Se necesitan al menos 3 meses de datos"}
        X      = np.arange(len(m)).reshape(-1, 1)
        y      = m["val"].values
        labels = m["label"].tolist()
        # Próximos 3 meses
        from dateutil.relativedelta import relativedelta
        ultimo = m["_mes"].iloc[-1].to_timestamp()
        fut_labels = [(ultimo + relativedelta(months=i+1)).strftime("%Y-%m") for i in range(3)]
    else:
        datos  = df[col_target].dropna()
        if len(datos) < 3:
            return {"error": "Datos insuficientes (mínimo 3 puntos)"}
        X      = np.arange(len(datos)).reshape(-1, 1)
        y      = datos.values
        labels = [str(i) for i in range(len(datos))]
        fut_labels = ["t+1", "t+2", "t+3"]

    model = LinearRegression().fit(X, y)
    r2    = float(model.score(X, y))
    slope = float(model.coef_[0])

    tendencia = (
        "estable"     if abs(slope) < 0.01 * max(np.mean(np.abs(y)), 1) else
        "creciente"   if slope > 0 else
        "decreciente"
    )

    fut_X   = np.array([[X[-1][0] + i] for i in range(1, 4)])
    pred    = model.predict(fut_X).tolist()
    linea   = [round(float(model.predict([[i]])[0]), 2) for i in range(len(y))]

    return {
        "tipo":        "regresion",
        "columna":     col_target,
        "tendencia":   tendencia,
        "pendiente":   round(slope, 4),
        "r2":          round(r2, 4),
        "labels":      labels,
        "valores":     [round(float(v), 2) for v in y],
        "linea_tend":  linea,
        "proj_labels": fut_labels,
        "proj_vals":   [round(float(v), 2) for v in pred],
        "meta": {
            "n_puntos":       int(len(y)),
            "valor_inicial":  round(float(y[0]), 2),
            "valor_final":    round(float(y[-1]), 2),
            "variacion_pct":  round((y[-1] - y[0]) / abs(y[0]) * 100, 1) if y[0] != 0 else 0,
        },
    }


# ══════════════════════════════════════════════════════════════════════════════
# 2. DETECCIÓN DE ANOMALÍAS (IQR)
# ══════════════════════════════════════════════════════════════════════════════

def detectar_anomalias(filas: list[dict], columnas: list[str]) -> dict:
    df       = _a_df(filas, columnas)
    n_cols   = _num_cols(df)
    col_fecha = _detectar_fecha_col(df, columnas)
    col_cat  = next(
        (c for c in columnas if c in df.columns
         and not pd.api.types.is_numeric_dtype(df[c])
         and df[c].nunique() <= 30 and c != col_fecha),
        None,
    )

    if not n_cols:
        return {"error": "No se encontraron columnas numéricas"}

    anomalias  = []
    stats_cols = {}

    for col in n_cols[:4]:
        serie = df[col].dropna()
        if len(serie) < 8:
            continue
        q1, q3 = float(serie.quantile(0.25)), float(serie.quantile(0.75))
        iqr    = q3 - q1
        if iqr == 0:
            continue
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        mask   = (df[col] < lower) | (df[col] > upper)

        stats_cols[col] = {
            "q1": round(q1, 2), "q3": round(q3, 2),
            "lower": round(lower, 2), "upper": round(upper, 2),
            "n_outliers": int(mask.sum()),
            "pct": round(mask.sum() / len(serie) * 100, 1),
        }

        for _, row in df[mask].head(10).iterrows():
            val      = float(row[col])
            contexto = ""
            if col_fecha and col_fecha in row.index:
                contexto = str(row[col_fecha])
            elif col_cat and col_cat in row.index:
                contexto = str(row[col_cat])
            anomalias.append({
                "columna":  col,
                "valor":    round(val, 2),
                "tipo":     "alto" if val > upper else "bajo",
                "limite":   round(upper if val > upper else lower, 2),
                "contexto": contexto,
            })

    anomalias.sort(key=lambda x: abs(x["valor"]), reverse=True)

    return {
        "tipo":            "anomalias",
        "total_anomalias": len(anomalias),
        "stats_cols":      stats_cols,
        "anomalias":       anomalias[:20],
    }


# ══════════════════════════════════════════════════════════════════════════════
# 3. CLUSTERING K-MEANS
# ══════════════════════════════════════════════════════════════════════════════

def clustering_kmeans(filas: list[dict], columnas: list[str]) -> dict:
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler

    df    = _a_df(filas, columnas)
    n_cols = _num_cols(df)

    if len(n_cols) < 2:
        return {"error": "Se necesitan al menos 2 columnas numéricas para clustering"}

    use_cols = n_cols[:4]
    df_c     = df[use_cols].dropna()

    if len(df_c) < 6:
        return {"error": "Datos insuficientes para clustering (mínimo 6 registros)"}

    k       = min(3, len(df_c) // 2)
    scaler  = StandardScaler()
    X_s     = scaler.fit_transform(df_c)
    km      = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels  = km.fit_predict(X_s)

    df_c    = df_c.copy()
    df_c["_cl"] = labels

    clusters = []
    for i in range(k):
        g     = df_c[df_c["_cl"] == i]
        stats = {
            col: {"avg": round(float(g[col].mean()), 2),
                  "min": round(float(g[col].min()),  2),
                  "max": round(float(g[col].max()),  2)}
            for col in use_cols
        }
        clusters.append({
            "id":         i,
            "nombre":     f"Grupo {i+1}",
            "n":          int((df_c["_cl"] == i).sum()),
            "pct":        round((df_c["_cl"] == i).sum() / len(df_c) * 100, 1),
            "stats":      stats,
            "dominante":  max(stats, key=lambda c: abs(stats[c]["avg"])),
        })

    col_x, col_y = use_cols[0], use_cols[1]
    scatter = [
        {"x": round(float(r[col_x]), 2),
         "y": round(float(r[col_y]), 2),
         "cluster": int(r["_cl"])}
        for _, r in df_c.iterrows()
    ][:300]

    return {
        "tipo":         "clustering",
        "k":            k,
        "cols":         use_cols,
        "col_x":        col_x,
        "col_y":        col_y,
        "clusters":     clusters,
        "scatter":      scatter,
        "inercia":      round(float(km.inertia_), 2),
    }


# ══════════════════════════════════════════════════════════════════════════════
# 4. CORRELACIÓN DE PEARSON
# ══════════════════════════════════════════════════════════════════════════════

def correlacion_pearson(filas: list[dict], columnas: list[str]) -> dict:
    df    = _a_df(filas, columnas)
    n_cols = _num_cols(df)

    if len(n_cols) < 2:
        return {"error": "Se necesitan al menos 2 columnas numéricas para correlación"}

    df_n = df[n_cols].dropna()
    if len(df_n) < 5:
        return {"error": "Datos insuficientes para correlación (mínimo 5 filas sin nulos)"}

    mat = df_n.corr(method="pearson")

    pares = []
    for i, c1 in enumerate(n_cols):
        for j, c2 in enumerate(n_cols):
            if j <= i:
                continue
            v = float(mat.loc[c1, c2]) if c1 in mat.index and c2 in mat.columns else 0.0
            if abs(v) > 0.5:
                pares.append({
                    "col1": c1, "col2": c2,
                    "r":    round(v, 3),
                    "tipo": "positiva" if v > 0 else "negativa",
                    "fuerza": "fuerte" if abs(v) > 0.7 else "moderada",
                })
    pares.sort(key=lambda x: abs(x["r"]), reverse=True)

    matriz = [
        {"col": c1,
         "valores": [
             round(float(mat.loc[c1, c2]) if c1 in mat.index and c2 in mat.columns else 0.0, 3)
             for c2 in n_cols
         ]}
        for c1 in n_cols
    ]

    return {
        "tipo":   "correlacion",
        "cols":   n_cols,
        "matriz": matriz,
        "pares":  pares,
    }


# ══════════════════════════════════════════════════════════════════════════════
# 5. SERIES DE TIEMPO
# ══════════════════════════════════════════════════════════════════════════════

def analizar_series_tiempo(filas: list[dict], columnas: list[str]) -> dict:
    df       = _a_df(filas, columnas)
    n_cols   = _num_cols(df)
    col_fecha = _detectar_fecha_col(df, columnas)

    if not col_fecha:
        return {"error": "No se detectó columna de fecha para series de tiempo"}
    if not n_cols:
        return {"error": "No se encontraron columnas numéricas"}

    col_target = n_cols[0]
    m = _monthly(df, col_fecha, col_target)

    if len(m) < 3:
        return {"error": "Se necesitan al menos 3 meses de datos"}

    vals  = m["val"].values.astype(float)
    mm3   = pd.Series(vals).rolling(3, min_periods=1).mean().round(2).tolist()
    crec  = pd.Series(vals).pct_change().mul(100).round(2).fillna(0).tolist()

    media, std = float(vals.mean()), float(vals.std())
    picos  = m.loc[m["val"] > media + std,  "label"].tolist()
    valles = m.loc[m["val"] < media - std, "label"].tolist()

    i_max = int(m["val"].idxmax())
    i_min = int(m["val"].idxmin())

    return {
        "tipo":       "series_tiempo",
        "columna":    col_target,
        "labels":     m["label"].tolist(),
        "valores":    [round(float(v), 2) for v in vals],
        "media_movil":mm3,
        "crecimiento":crec,
        "resumen": {
            "n_meses":     int(len(m)),
            "mes_pico":    m.loc[i_max, "label"],
            "val_pico":    round(float(m.loc[i_max, "val"]), 2),
            "mes_minimo":  m.loc[i_min, "label"],
            "val_minimo":  round(float(m.loc[i_min, "val"]), 2),
            "crec_total":  round((vals[-1] - vals[0]) / abs(vals[0]) * 100, 1) if vals[0] != 0 else 0,
            "meses_altos": picos,
            "meses_bajos": valles,
        },
    }


# ══════════════════════════════════════════════════════════════════════════════
# ANÁLISIS COMPLETO
# ══════════════════════════════════════════════════════════════════════════════

def analisis_completo(filas: list[dict], columnas: list[str]) -> dict:
    resultados = {}
    for nombre, fn in [
        ("regresion",    analizar_regresion),
        ("anomalias",    detectar_anomalias),
        ("clustering",   clustering_kmeans),
        ("correlacion",  correlacion_pearson),
        ("series_tiempo",analizar_series_tiempo),
    ]:
        try:
            resultados[nombre] = fn(filas, columnas)
        except Exception as e:
            resultados[nombre] = {"error": str(e)}
    return {"tipo": "completo", **resultados}


# ══════════════════════════════════════════════════════════════════════════════
# ENTRADA PÚBLICA
# ══════════════════════════════════════════════════════════════════════════════

_FN_MAP = {
    "regresion":    analizar_regresion,
    "anomalias":    detectar_anomalias,
    "clustering":   clustering_kmeans,
    "correlacion":  correlacion_pearson,
    "series_tiempo":analizar_series_tiempo,
    "completo":     analisis_completo,
}


def ejecutar_analisis(dataset_id: int, tipo: str) -> dict:
    try:
        filas, columnas = _get_filas(dataset_id)
    except ValueError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": f"Error de conexión a la base de datos: {str(e)}"}

    if not filas:
        return {"error": "El dataset está vacío"}
    fn = _FN_MAP.get(tipo)
    if not fn:
        return {"error": f"Tipo de análisis desconocido: '{tipo}'"}
    try:
        return fn(filas, columnas)
    except Exception as e:
        return {"error": f"Error en análisis {tipo}: {str(e)}"}
