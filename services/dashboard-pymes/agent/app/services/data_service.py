"""
data_service.py
Consulta PostgreSQL y construye un contexto analítico rico para Gemini:
  - Estadísticas numéricas (min/max/avg/sum)
  - Frecuencias y porcentajes para columnas categóricas
  - Cruce cat × num: count / avg / sum por grupo
  - Ranking top 5 por promedio
  - Resumen mensual
  - Muestra de filas
"""
import json
import re
import psycopg2
import psycopg2.extras
from typing import Optional
from app.config import settings

UMBRAL_MUESTRA  = 200   # datasets > N filas → muestreo en la tabla
MAX_CATS_CRUCE  = 30    # máx valores únicos para incluir en cruce cat×num
MAX_CATS_FREC   = 20    # máx valores únicos para mostrar distribución %
TOP_N           = 5     # tamaño del ranking

# Palabras que identifican columnas identificadoras (excluir de análisis)
_ID_WORDS = {
    'id', 'nit', 'code', 'cod', 'codigo', 'cedula', 'dni', 'ruc', 'rfc', 'cif',
    'pk', 'fk', 'ref', 'key', 'telefono', 'phone', 'zip', 'cp', 'postal',
}


# ══════════════════════════════════════════════════════════════════════════════
# Acceso a BD
# ══════════════════════════════════════════════════════════════════════════════

def _get_conn():
    return psycopg2.connect(
        host=settings.DB_HOST, port=settings.DB_PORT,
        dbname=settings.DB_NAME, user=settings.DB_USER,
        password=settings.DB_PASSWORD, connect_timeout=5,
    )


def _get_datasets(cur, empresa_id: Optional[int], dataset_id: Optional[int]) -> list:
    if dataset_id:
        cur.execute(
            """SELECT d.id, d.nombre, d.descripcion, d.total_filas, d.columnas,
                      e.nombre AS empresa_nombre, e.sector
               FROM datasets d JOIN empresas e ON e.id = d.empresa_id
               WHERE d.id = %s""",
            (dataset_id,),
        )
    elif empresa_id:
        cur.execute(
            """SELECT d.id, d.nombre, d.descripcion, d.total_filas, d.columnas,
                      e.nombre AS empresa_nombre, e.sector
               FROM datasets d JOIN empresas e ON e.id = d.empresa_id
               WHERE d.empresa_id = %s ORDER BY d.created_at DESC LIMIT %s""",
            (empresa_id, settings.MAX_DATASETS),
        )
    else:
        return []
    return cur.fetchall()


def _get_todas_las_filas(cur, dataset_id: int) -> list[dict]:
    cur.execute(
        "SELECT datos FROM registros_datos WHERE dataset_id = %s ORDER BY fila_numero",
        (dataset_id,),
    )
    return [row["datos"] for row in cur.fetchall()]


def _tomar_muestra(filas: list[dict], total: int) -> list[dict]:
    if total <= UMBRAL_MUESTRA:
        return filas
    limite = settings.MAX_FILAS
    if len(filas) <= limite:
        return filas
    paso = len(filas) / limite
    return [filas[int(i * paso)] for i in range(limite)]


# ══════════════════════════════════════════════════════════════════════════════
# Clasificación de columnas
# ══════════════════════════════════════════════════════════════════════════════

def _es_numero(s: str) -> bool:
    try:
        float(s.replace(",", "."))
        return True
    except ValueError:
        return False


def _clasificar_columnas(filas: list[dict], columnas: list[str]) -> tuple[list, list]:
    """
    Retorna (num_cols, cat_cols).
    Excluye: IDs, fechas-año, columnas casi vacías.
    """
    muestra = filas[:60]
    num_cols: list[str] = []
    cat_cols: list[str] = []

    for col in columnas:
        # Descartar IDs por nombre
        palabras = set(re.split(r'[_\-\s]', col.lower()))
        if palabras & _ID_WORDS:
            continue

        vals = [fila.get(col) for fila in muestra
                if fila.get(col) not in (None, "", "null", "NULL")]
        if len(vals) < 3:
            continue

        str_vals = [str(v).strip() for v in vals]
        num_count = sum(1 for v in str_vals if _es_numero(v.replace(",", ".")))

        if num_count / len(vals) > 0.8:
            # Descartar si parecen años (1900-2100, enteros)
            nums = [float(v.replace(",", ".")) for v in str_vals if _es_numero(v.replace(",", "."))]
            if all(1900 <= n <= 2100 and n == int(n) for n in nums):
                continue
            num_cols.append(col)
        else:
            unique = {v.strip() for v in str_vals}
            if 2 <= len(unique) <= 50:
                cat_cols.append(col)

    return num_cols, cat_cols


# ══════════════════════════════════════════════════════════════════════════════
# Estadísticas numéricas
# ══════════════════════════════════════════════════════════════════════════════

def _stats_numericas(filas: list[dict], num_cols: list[str]) -> dict:
    """Min / max / avg / sum sobre todos los registros."""
    stats = {}
    for col in num_cols:
        vals = []
        for fila in filas:
            v = fila.get(col)
            if v not in (None, ""):
                try:
                    vals.append(float(str(v).replace(",", ".")))
                except (ValueError, TypeError):
                    pass
        if vals:
            stats[col] = {
                "registros": len(vals),
                "min":       round(min(vals), 2),
                "max":       round(max(vals), 2),
                "promedio":  round(sum(vals) / len(vals), 2),
                "total":     round(sum(vals), 2),
            }
    return stats


# ══════════════════════════════════════════════════════════════════════════════
# Frecuencias y porcentajes (columnas categóricas y booleanas)
# ══════════════════════════════════════════════════════════════════════════════

def _stats_frecuencia(filas: list[dict], cat_cols: list[str]) -> dict:
    """
    Para cada columna categórica con ≤ MAX_CATS_FREC valores únicos,
    calcula count y porcentaje de cada valor.
    """
    total = len(filas)
    if total == 0:
        return {}
    resultado = {}
    for col in cat_cols:
        freq: dict[str, int] = {}
        for fila in filas:
            v = str(fila.get(col) or "").strip()
            if v:
                freq[v] = freq.get(v, 0) + 1
        if 2 <= len(freq) <= MAX_CATS_FREC:
            resultado[col] = {
                k: {"count": c, "pct": round(c / total * 100, 1)}
                for k, c in sorted(freq.items(), key=lambda x: -x[1])
            }
    return resultado


# ══════════════════════════════════════════════════════════════════════════════
# Cruce categórica × numérica (count / avg / sum por grupo)
# ══════════════════════════════════════════════════════════════════════════════

def _cruce_cat_num(filas: list[dict], cat_cols: list[str], num_cols: list[str]) -> dict:
    """
    Para cada columna categórica (2-MAX_CATS_CRUCE grupos únicos):
      por cada valor → {registros, col_num: {avg, sum}}
    Grupos ordenados de mayor a menor conteo.
    """
    if not num_cols:
        return {}
    resultado = {}
    for cat_col in cat_cols:
        sumas:  dict[str, dict] = {}
        conteo: dict[str, int]  = {}
        for fila in filas:
            clave = str(fila.get(cat_col) or "").strip()
            if not clave:
                continue
            if clave not in sumas:
                sumas[clave]  = {nc: 0.0 for nc in num_cols}
                conteo[clave] = 0
            conteo[clave] += 1
            for nc in num_cols:
                v = fila.get(nc)
                if v not in (None, ""):
                    try:
                        sumas[clave][nc] += float(str(v).replace(",", "."))
                    except (ValueError, TypeError):
                        pass
        if 1 < len(sumas) <= MAX_CATS_CRUCE:
            grupos = {}
            for k in sorted(sumas, key=lambda x: -conteo[x]):
                n = conteo[k]
                grupos[k] = {
                    "registros": n,
                    **{
                        nc: {"avg": round(sumas[k][nc] / n, 2), "sum": round(sumas[k][nc], 2)}
                        for nc in num_cols
                        if sumas[k][nc] != 0.0
                    },
                }
            resultado[cat_col] = grupos
    return resultado


def _ranking_top_n(cruce: dict, n: int = TOP_N) -> dict:
    """
    Para cada cat×num en el cruce, genera un ranking top N por avg descendente.
    Returns: { cat_col: { num_col: [(valor, avg, count), ...] } }
    """
    rankings: dict[str, dict] = {}
    for cat_col, grupos in cruce.items():
        sample = next(iter(grupos.values()), {})
        num_cols_presentes = [k for k in sample if k != "registros"]
        for num_col in num_cols_presentes:
            try:
                ranked = sorted(
                    [(k, g[num_col]["avg"], g["registros"])
                     for k, g in grupos.items()
                     if num_col in g and isinstance(g[num_col], dict)],
                    key=lambda x: -x[1],
                )[:n]
                if ranked:
                    rankings.setdefault(cat_col, {})[num_col] = ranked
            except (KeyError, TypeError):
                pass
    return rankings


# ══════════════════════════════════════════════════════════════════════════════
# Resumen mensual
# ══════════════════════════════════════════════════════════════════════════════

def _extraer_mes(s: str) -> Optional[str]:
    m = re.match(r"(\d{4})[-/](\d{1,2})", s)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}"
    m = re.match(r"(\d{1,2})[-/](\d{1,2})[-/](\d{4})", s)
    if m:
        return f"{m.group(3)}-{int(m.group(2)):02d}"
    return None


def _stats_por_mes(filas: list[dict], columnas: list[str], num_cols: list[str]) -> dict:
    """Agrupa sumas numéricas por mes (YYYY-MM)."""
    fecha_col = None
    for col in columnas:
        muestras = [fila.get(col) for fila in filas[:20] if fila.get(col)]
        hits = sum(
            1 for v in muestras
            if (str(v)[4:5] in ("-", "/") and str(v)[:4].isdigit()) or
               (str(v)[2:3] in ("-", "/") and str(v)[5:9].isdigit())
        )
        if hits >= len(muestras) * 0.7 and hits > 0:
            fecha_col = col
            break
    if not fecha_col or not num_cols:
        return {}

    por_mes: dict[str, dict] = {}
    for fila in filas:
        mes = _extraer_mes(str(fila.get(fecha_col) or "").strip())
        if not mes:
            continue
        if mes not in por_mes:
            por_mes[mes] = {nc: 0.0 for nc in num_cols}
        for nc in num_cols:
            v = fila.get(nc)
            if v not in (None, "") and _es_numero(str(v)):
                por_mes[mes][nc] += float(str(v).replace(",", "."))

    return {
        k: {nc: round(v, 2) for nc, v in sumas.items() if v != 0.0}
        for k, sumas in sorted(por_mes.items())
    }


# ══════════════════════════════════════════════════════════════════════════════
# Formateadores de texto
# ══════════════════════════════════════════════════════════════════════════════

def _fmt_stats_numericas(stats: dict) -> str:
    lines = ["ESTADÍSTICAS NUMÉRICAS (todos los registros):"]
    for col, s in stats.items():
        lines.append(
            f"  {col}: n={s['registros']:,}, "
            f"min={s['min']:,}, max={s['max']:,}, "
            f"promedio={s['promedio']:,}, total={s['total']:,}"
        )
    return "\n".join(lines)


def _fmt_frecuencias(frecuencias: dict, total: int) -> str:
    if not frecuencias:
        return ""
    lines = ["FRECUENCIAS Y DISTRIBUCIONES (todos los registros):"]
    for col, freq in frecuencias.items():
        lines.append(f"\n  [{col}] — {total} registros:")
        for val, d in freq.items():
            bar = "█" * max(1, int(d["pct"] / 5))
            lines.append(f"    {val:<22}: {d['count']:>5} ({d['pct']:>5.1f}%)  {bar}")
    return "\n".join(lines)


def _fmt_cruce(cruce: dict, rankings: dict) -> str:
    if not cruce:
        return ""
    lines = ["ANÁLISIS CRUZADO — count / avg / sum por categoría (todos los registros):"]

    for cat_col, grupos in cruce.items():
        # Columnas numéricas presentes en este cruce
        sample = next(iter(grupos.values()), {})
        num_cols_here = [k for k in sample if k != "registros"]
        if not num_cols_here:
            continue

        n_grupos = len(grupos)
        lines.append(f"\n  [{cat_col}] — {n_grupos} valores únicos:")

        # Cabecera de tabla
        w = max((len(k) for k in grupos), default=15)
        w = max(w, 15)
        header = f"  {'Valor':<{w}} | {'N':>6}"
        for nc in num_cols_here:
            nc_short = nc[:14]
            header += f" | {nc_short+'_avg':>16} | {nc_short+'_sum':>16}"
        sep = "  " + "-" * (len(header) - 2)
        lines += [header, sep]

        for k, g in grupos.items():
            row = f"  {k:<{w}} | {g['registros']:>6}"
            for nc in num_cols_here:
                if nc in g and isinstance(g[nc], dict):
                    row += f" | {g[nc]['avg']:>16,.2f} | {g[nc]['sum']:>16,.2f}"
                else:
                    row += f" | {'—':>16} | {'—':>16}"
            lines.append(row)

        # Rankings top N para este categorical col
        if cat_col in rankings:
            for num_col, ranked in rankings[cat_col].items():
                lines.append(f"\n  Top {len(ranked)} '{cat_col}' por promedio de '{num_col}':")
                for i, (val, avg, cnt) in enumerate(ranked, 1):
                    lines.append(f"    {i}. {val}: {avg:,.2f} promedio ({cnt} registros)")

    return "\n".join(lines)


def _fmt_mensual(por_mes: dict) -> str:
    if not por_mes:
        return ""
    lines = ["RESUMEN MENSUAL:"]
    for mes, sumas in por_mes.items():
        partes = ", ".join(f"{nc}={v:,.2f}" for nc, v in sumas.items())
        lines.append(f"  {mes}: {partes}")
    n = len(por_mes)
    if n > 1:
        lines.append(f"\n  Promedios mensuales ({n} meses):")
        all_cols = list(next(iter(por_mes.values())).keys())
        for nc in all_cols:
            total_nc = sum(v.get(nc, 0) for v in por_mes.values())
            lines.append(f"    {nc}: {total_nc / n:,.2f} por mes")
    return "\n".join(lines)


def _fmt_tabla(filas: list[dict], columnas: list[str]) -> str:
    if not filas:
        return "(sin datos)"
    header = " | ".join(columnas)
    sep    = "-" * max(len(header), 10)
    lines  = [header, sep]
    for fila in filas:
        lines.append(" | ".join(str(fila.get(c, "")) for c in columnas))
    return "\n".join(lines)


# ══════════════════════════════════════════════════════════════════════════════
# Función principal
# ══════════════════════════════════════════════════════════════════════════════

def construir_contexto(empresa_id: Optional[int], dataset_id: Optional[int]) -> tuple[str, int]:
    """
    Construye el bloque de contexto analítico para Gemini.
    Estadísticas siempre sobre TODOS los registros.
    Tabla de filas: completa si ≤ UMBRAL_MUESTRA, muestra si es mayor.
    """
    if not empresa_id and not dataset_id:
        return "", 0

    try:
        conn = _get_conn()
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        datasets = _get_datasets(cur, empresa_id, dataset_id)
        if not datasets:
            cur.close(); conn.close()
            return "No se encontraron datasets para esta empresa.", 0

        empresa_nombre = datasets[0]["empresa_nombre"]
        empresa_sector = datasets[0].get("sector") or "No especificado"
        bloques = [f"EMPRESA: {empresa_nombre}", f"SECTOR: {empresa_sector}\n"]

        for ds in datasets:
            columnas_raw = ds["columnas"]
            columnas = (
                json.loads(columnas_raw)
                if isinstance(columnas_raw, str)
                else (columnas_raw or [])
            )
            total_filas = ds["total_filas"] or 0

            todas       = _get_todas_las_filas(cur, ds["id"])
            tabla_filas = _tomar_muestra(todas, total_filas)
            es_completo = len(tabla_filas) == len(todas)

            # ── Clasificar columnas ───────────────────────────────────────────
            num_cols, cat_cols = _clasificar_columnas(todas, columnas)

            # ── Calcular estadísticas (siempre sobre TODOS los registros) ─────
            stats_num  = _stats_numericas(todas, num_cols)
            frecuencias = _stats_frecuencia(todas, cat_cols)
            cruce      = _cruce_cat_num(todas, cat_cols, num_cols)
            rankings   = _ranking_top_n(cruce)
            stats_mes  = _stats_por_mes(todas, columnas, num_cols)

            # ── Ensamblar bloque de texto ─────────────────────────────────────
            bloque = [
                f"--- Dataset: {ds['nombre']} ---",
                f"Total de filas: {total_filas:,}",
                f"Columnas ({len(columnas)}): {', '.join(columnas)}",
                f"Columnas numéricas: {', '.join(num_cols) or '(ninguna)'}",
                f"Columnas categóricas: {', '.join(cat_cols) or '(ninguna)'}",
            ]
            if ds.get("descripcion"):
                bloque.append(f"Descripción: {ds['descripcion']}")

            if stats_num:
                bloque.append("\n" + _fmt_stats_numericas(stats_num))

            frec_txt = _fmt_frecuencias(frecuencias, len(todas))
            if frec_txt:
                bloque.append("\n" + frec_txt)

            cruce_txt = _fmt_cruce(cruce, rankings)
            if cruce_txt:
                bloque.append("\n" + cruce_txt)

            mes_txt = _fmt_mensual(stats_mes)
            if mes_txt:
                bloque.append("\n" + mes_txt)

            # ── Muestra de filas ──────────────────────────────────────────────
            if es_completo:
                bloque.append(f"\nDATOS COMPLETOS ({len(tabla_filas)} filas):")
            else:
                bloque.append(
                    f"\nMUESTRA DE DATOS ({len(tabla_filas)} de {total_filas:,} filas"
                    f" — estadísticas calculadas sobre el total):"
                )
            bloque.append(_fmt_tabla(tabla_filas, columnas))

            bloques.append("\n".join(bloque))

        cur.close()
        conn.close()

        contexto = "\n\n".join(bloques)
        if len(contexto) > settings.MAX_CTX_CHARS:
            contexto = (
                contexto[:settings.MAX_CTX_CHARS]
                + "\n[... contexto truncado por longitud ...]"
            )

        return contexto, len(datasets)

    except psycopg2.OperationalError as e:
        raise ConnectionError(f"No se pudo conectar a PostgreSQL: {e}") from e
