const { query } = require('../config/database');

// ── Heurísticas de tipo por nombres de columna ────────────────────────────────
const TIPO_PATRONES = {
  salud:      ['diagnostico', 'medico', 'especialidad', 'paciente', 'hospital', 'clinica',
               'enfermedad', 'tratamiento', 'consulta', 'eps', 'doctor', 'cirujano',
               'cama', 'urgencias', 'farmaco', 'medicamento', 'patologia'],
  deportes:   ['goles', 'jugador', 'partido', 'rival', 'marcador', 'equipo', 'posicion',
               'resultado', 'torneo', 'liga', 'temporada', 'cancha', 'arbitro', 'asistencias',
               'tarjeta', 'penales', 'corner', 'estadio'],
  financiero: ['venta', 'ventas', 'ingreso', 'ingresos', 'gasto', 'gastos', 'egreso', 'egresos',
               'factura', 'revenue', 'expense', 'utilidad', 'ganancia', 'precio_venta',
               'valor', 'monto', 'flujo', 'balance', 'presupuesto', 'costo'],
  inventario: ['stock', 'inventario', 'existencias', 'sku', 'almacen', 'bodega',
               'unidades_disponibles', 'cantidad_disponible'],
  rrhh:       ['empleado', 'empleados', 'salario', 'sueldo', 'departamento', 'cargo',
               'nomina', 'trabajador', 'contrato', 'hrs_trabajadas', 'horas_trabajadas'],
  produccion: ['produccion', 'producido', 'orden_produccion', 'turno', 'linea',
               'maquina', 'lote', 'fabricacion', 'planta'],
  ventas:     ['cliente', 'clientes', 'pedido', 'cotizacion', 'orden_venta', 'descuento'],
  insumos:    ['insumo', 'insumos', 'proveedor', 'materia_prima', 'compra', 'requisicion'],
};

const FECHA_KEYS = [
  'fecha', 'date', 'periodo', 'mes', 'month',
  'fecha_venta', 'fecha_registro', 'fecha_compra', 'fecha_ingreso',
  'fecha_fabricacion', 'fecha_pedido', 'fecha_emision',
];
const CAT_KEYS = [
  'categoria', 'categoría', 'category', 'tipo', 'type', 'clase', 'rubro',
  'producto', 'departamento', 'empleado', 'proveedor', 'cliente',
  'insumo', 'nombre', 'descripcion',
];

// ── Utilidades básicas ────────────────────────────────────────────────────────

function detectarTipo(columnas) {
  const lc = columnas.map(c => c.toLowerCase().trim());
  const scores = {};
  for (const [tipo, patrones] of Object.entries(TIPO_PATRONES)) {
    scores[tipo] = 0;
    for (const p of patrones) {
      if (lc.some(c => c === p || c.includes(p))) scores[tipo]++;
    }
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : 'general';
}

function detectCol(columnas, patterns) {
  const lc = columnas.map(c => c.toLowerCase().trim());
  for (const p of patterns) {
    const i = lc.findIndex(c => c === p || c.includes(p));
    if (i >= 0) return columnas[i];
  }
  return null;
}

// Detección de columna de categoría: prioriza exacta y descarta identificadores
function detectColCategoria(columnas) {
  const lc = columnas.map(c => c.toLowerCase().trim());
  for (const p of CAT_KEYS) {
    const i = lc.findIndex(c => c === p);
    if (i >= 0) return columnas[i];
  }
  for (const p of CAT_KEYS) {
    const i = lc.findIndex(c => c.includes(p) && !esNombreIdentificador(c));
    if (i >= 0) return columnas[i];
  }
  return null;
}

function parseNum(val) {
  if (val == null || val === '') return null;
  const n = parseFloat(String(val).replace(/\s/g, '').replace(',', '.'));
  return isNaN(n) ? null : n;
}

function parseFecha(val) {
  if (!val) return null;
  const s = String(val).trim();
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return { anio: +m[1], mes: +m[2] };
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m) return { anio: +m[3], mes: +m[2] };
  const nombres = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const lower = s.toLowerCase();
  for (let i = 0; i < nombres.length; i++) {
    if (lower.startsWith(nombres[i])) {
      const y = s.match(/\d{4}/);
      return { anio: y ? +y[0] : new Date().getFullYear(), mes: i + 1 };
    }
  }
  return null;
}

const STOP_WORDS_METRICA = new Set([
  'id', 'nit', 'code', 'cod', 'codigo', 'cedula', 'dni', 'ruc', 'rfc', 'cif',
  'pk', 'fk', 'ref', 'key', 'telefono', 'phone', 'zip', 'cp', 'postal', 'numero',
  'fecha', 'date', 'mes', 'month', 'year', 'año', 'anio', 'periodo', 'semana',
  'trimestre', 'quarter', 'hora', 'time', 'timestamp',
]);

function esNombreIdentificador(col) {
  const palabras = col.toLowerCase().replace(/[\s\-\.]/g, '_').split('_').filter(Boolean);
  return palabras.some(p => STOP_WORDS_METRICA.has(p));
}

function detectarColumnasNumericas(columnas, registros, excluir = []) {
  const muestra = registros.slice(0, 30);
  return columnas.filter(col => {
    if (excluir.includes(col)) return false;
    if (esNombreIdentificador(col)) return false;
    const vals = muestra.map(r => parseNum(r[col])).filter(v => v !== null);
    if (vals.length < 3) return false;
    if (vals.length >= 5 && vals.every(v => v >= 1900 && v <= 2100 && v === Math.floor(v))) return false;
    return true;
  });
}

// Detecta columnas de texto categórico útiles (no IDs, no fechas, valores repetidos)
function detectarColumnasTexto(columnas, registros, excluir = []) {
  const muestra = registros.slice(0, 60);
  return columnas.filter(col => {
    if (excluir.includes(col)) return false;
    if (esNombreIdentificador(col)) return false;
    const vals = muestra.map(r => r[col]).filter(v => v != null && String(v).trim() !== '');
    if (vals.length < 3) return false;
    // Descartar si >80% son números
    const numCount = vals.filter(v => parseNum(v) !== null).length;
    if (numCount / vals.length > 0.8) return false;
    // Cardinalidad útil: entre 2 y 50 valores únicos
    const unique = new Set(vals.map(v => String(v).trim())).size;
    return unique >= 2 && unique <= 50;
  });
}

// ── Helpers de análisis semántico ─────────────────────────────────────────────

function humanLabel(col) {
  return col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Columnas que representan una TASA o PRECIO (deben usarse con promedio, no suma)
const PATRONES_PROMEDIO = [
  'precio', 'price', 'unitario', 'unit_cost', 'costo_unit', 'tarifa',
  'tasa', 'rate', 'porcentaje', 'percent', 'pct', 'por_unidad',
  // Columnas de duración/tiempo → mostrar promedio, no suma
  'dias', 'dia', 'days', 'horas', 'hrs', 'minutos', 'duracion', 'tiempo',
  // Columnas de eficiencia/rendimiento
  'eficiencia', 'rendimiento', 'calificacion', 'puntaje', 'score',
];
function isTipoPromedio(col) {
  const lc = col.toLowerCase();
  return PATRONES_PROMEDIO.some(p => lc.includes(p));
}

// Clasificación explícita: 'acumulable' (sumas tienen sentido) | 'estadistica' (solo promedios)
function clasificarColumna(col, valores = []) {
  if (isTipoPromedio(col)) return 'estadistica';
  // Si todos los valores están en 0-100 → probablemente un porcentaje/ratio
  if (valores.length >= 5 && valores.every(v => v >= 0 && v <= 100)) return 'estadistica';
  return 'acumulable';
}

// Detecta el formato de visualización correcto para cada columna
function detectarFormato(col) {
  const lc = col.toLowerCase();
  const MONETARIO   = ['valor', 'total', 'precio', 'costo', 'monto', 'ingreso', 'gasto',
                        'venta', 'salario', 'sueldo', 'pago', 'revenue', 'sales', 'importe',
                        'utilidad', 'ganancia', 'cobro', 'factura', 'facturacion', 'honorario'];
  const PORCENTAJE  = ['pct', 'porcentaje', 'percent', 'precision', 'tasa', 'ratio',
                        'rendimiento', 'eficiencia', 'margen', 'ocupacion', 'cumplimiento'];
  const ENTERO      = ['cantidad', 'unidades', 'registros', 'items', 'piezas', 'count',
                        'cant', 'qty', 'goles', 'puntos', 'partidas', 'victorias', 'derrotas',
                        'empates', 'asistencias', 'faltas', 'juegos', 'partidos', 'minutos',
                        'horas', 'dias', 'num_', 'numero', 'empleados', 'clientes'];
  if (MONETARIO.some(p => lc.includes(p)))  return 'moneda';
  if (PORCENTAJE.some(p => lc.includes(p))) return 'porcentaje';
  if (ENTERO.some(p => lc.includes(p)))     return 'entero';
  return 'numero';
}
function esMonetaria(col) { return detectarFormato(col) === 'moneda'; }

// ── Detección de outliers (método IQR) ────────────────────────────────────────
function detectarOutliers(valores) {
  if (valores.length < 8) return { tiene_outliers: false, count: 0 };
  const sorted = [...valores].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  if (iqr === 0) return { tiene_outliers: false, count: 0 };
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const outliers = valores.filter(v => v < lower || v > upper);
  return {
    tiene_outliers: outliers.length > 0,
    count: outliers.length,
    lower_bound: Math.round(lower * 100) / 100,
    upper_bound: Math.round(upper * 100) / 100,
  };
}

// Dos métricas son comparables si la diferencia de escala es < 50×
function sonComparables(m1, m2) {
  if (!m1 || !m2 || m1.max === 0 || m2.max === 0) return false;
  const ratio = Math.max(m1.max, m2.max) / Math.min(m1.max, m2.max);
  return ratio < 50;
}

// ── Motor de insights automáticos ─────────────────────────────────────────────
function buildInsights(metricas, registros, colCat, colFecha, anio) {
  const insights = [];

  // Datos insuficientes — alerta inmediata
  if (registros.length < 5) {
    insights.push({
      tipo: 'alerta',
      titulo: 'Datos insuficientes',
      texto: `Solo hay **${registros.length} registros**. Se recomiendan al menos 20 para un análisis confiable.`,
      icono: 'warning',
    });
    return insights;
  }
  if (metricas.length === 0) return insights;

  const metP = metricas[0];
  const MESES_N = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  // 1. Categoría / valor dominante
  if (colCat) {
    const sum = {};
    let totalG = 0;
    for (const r of registros) {
      const cat = String(r[colCat] || '').trim();
      const v = parseNum(r[metP.col]);
      if (!cat || v === null) continue;
      sum[cat] = (sum[cat] || 0) + v;
      totalG += v;
    }
    const sorted = Object.entries(sum).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0 && totalG > 0) {
      const [topName, topVal] = sorted[0];
      const pct = Math.round((topVal / totalG) * 100);
      if (pct >= 25) {
        insights.push({
          tipo: pct >= 50 ? 'dominante' : 'destacado',
          titulo: `${topName} lidera`,
          texto: `**${topName}** concentra el **${pct}%** del total de ${humanLabel(metP.col)} (${sorted.length} categorías analizadas).`,
          icono: pct >= 50 ? 'warning' : 'chart',
        });
      }
    }
  }

  // 2. Mes pico y mes bajo (si hay columna de fecha)
  if (colFecha) {
    const sumMes = {};
    for (const r of registros) {
      const f = parseFecha(r[colFecha]);
      if (!f || f.anio !== anio) continue;
      const v = parseNum(r[metP.col]);
      if (v === null) continue;
      sumMes[f.mes] = (sumMes[f.mes] || 0) + v;
    }
    const mesEntries = Object.entries(sumMes).sort((a, b) => b[1] - a[1]);
    if (mesEntries.length >= 3) {
      const [picoMes, picoVal] = mesEntries[0];
      const [bajaMes, bajaVal] = mesEntries[mesEntries.length - 1];
      const ratio = picoVal / Math.max(bajaVal, 1);
      insights.push({
        tipo: 'pico',
        titulo: `Pico en ${MESES_N[parseInt(picoMes) - 1]}`,
        texto: `**${MESES_N[parseInt(picoMes) - 1]}** fue el mes de mayor actividad con ${picoVal.toLocaleString('es-CO')} en ${humanLabel(metP.col)}.`
          + (ratio > 2 ? ` (${Math.round(ratio)}× más que ${MESES_N[parseInt(bajaMes) - 1]}, el de menor actividad)` : ''),
        icono: 'trend',
      });
    }
  }

  // 3. Outliers en la métrica principal
  for (const m of metricas.slice(0, 3)) {
    const valores = registros.map(r => parseNum(r[m.col])).filter(v => v !== null);
    const out = detectarOutliers(valores);
    if (out.tiene_outliers && out.count >= 2) {
      const pct = Math.round((out.count / valores.length) * 100);
      insights.push({
        tipo: 'outlier',
        titulo: `Valores atípicos en ${humanLabel(m.col)}`,
        texto: `Se detectaron **${out.count} registros** (${pct}%) fuera del rango normal [${out.lower_bound.toLocaleString('es-CO')} – ${out.upper_bound.toLocaleString('es-CO')}]. Verifique si son errores o casos excepcionales.`,
        icono: 'alert',
      });
      break; // Solo reportar el primer outlier encontrado
    }
  }

  // 4. Alta variabilidad (coeficiente de variación > 60%)
  for (const m of metricas.slice(0, 3)) {
    const valores = registros.map(r => parseNum(r[m.col])).filter(v => v !== null);
    if (valores.length < 10) continue;
    const mean = valores.reduce((a, b) => a + b, 0) / valores.length;
    if (mean === 0) continue;
    const variance = valores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / valores.length;
    const cv = Math.sqrt(variance) / Math.abs(mean);
    if (cv > 0.6) {
      insights.push({
        tipo: 'variabilidad',
        titulo: `Alta dispersión en ${humanLabel(m.col)}`,
        texto: `Los valores de **${humanLabel(m.col)}** tienen alta variabilidad (CV: ${Math.round(cv * 100)}%). Rango: ${m.min.toLocaleString('es-CO')} – ${m.max.toLocaleString('es-CO')}.`,
        icono: 'info',
      });
      break;
    }
  }

  // 5. Top performer (jugador, nombre, vendedor, empleado, etc.)
  const COLS_PERFORMER = ['jugador', 'nombre', 'empleado', 'vendedor', 'agente', 'cliente',
                           'representante', 'responsable', 'operador', 'staff', 'worker'];
  const allColsReg = Object.keys(registros[0] || {});
  const colPerf = allColsReg.find(c =>
    COLS_PERFORMER.some(p => c.toLowerCase().includes(p))
  );
  if (colPerf && metricas.length > 0 && !colPerf.includes(colCat || '__')) {
    const sum = {};
    for (const r of registros) {
      const name = String(r[colPerf] || '').trim();
      const v = parseNum(r[metricas[0].col]);
      if (!name || v === null) continue;
      sum[name] = (sum[name] || 0) + v;
    }
    const top = Object.entries(sum).sort((a, b) => b[1] - a[1])[0];
    if (top && Object.keys(sum).length >= 2) {
      insights.push({
        tipo: 'destacado',
        titulo: `Top ${humanLabel(colPerf)}`,
        texto: `**${top[0]}** lidera con **${top[1].toLocaleString('es-CO')}** en ${humanLabel(metricas[0].col)}.`,
        icono: 'chart',
      });
    }
  }

  // 6. Columna resultado (victorias/derrotas)
  const colResultado = allColsReg.find(c => c.toLowerCase().includes('resultado'));
  if (colResultado) {
    const freq = {};
    for (const r of registros) {
      const v = String(r[colResultado] || '').trim().toLowerCase();
      if (v) freq[v] = (freq[v] || 0) + 1;
    }
    const total = Object.values(freq).reduce((a, b) => a + b, 0);
    const victorias = freq['victoria'] || freq['ganado'] || freq['win'] || freq['w'] || freq['g'] || 0;
    const derrotas  = freq['derrota']  || freq['perdido'] || freq['loss'] || freq['l'] || freq['p'] || 0;
    if (victorias > 0 && total > 0) {
      const pct = Math.round((victorias / total) * 100);
      insights.push({
        tipo: pct >= 50 ? 'pico' : 'outlier',
        titulo: `Tasa de victorias: ${pct}%`,
        texto: `De **${total} partidos**: ${victorias} victorias (${pct}%)${derrotas > 0 ? `, ${derrotas} derrotas (${Math.round((derrotas/total)*100)}%)` : ''}.`,
        icono: pct >= 50 ? 'trend' : 'warning',
      });
    }
  }

  // Garantizar mínimo 3 insights — añadir resumen general si faltan
  if (insights.length < 3 && metricas.length > 0) {
    const m = metricas[0];
    insights.push({
      tipo: 'destacado',
      titulo: `Resumen de ${humanLabel(m.col)}`,
      texto: `**Total:** ${m.total.toLocaleString('es-CO')} · **Promedio:** ${m.promedio.toLocaleString('es-CO')} · **Máximo:** ${m.max.toLocaleString('es-CO')}`,
      icono: 'chart',
    });
  }
  if (insights.length < 3 && metricas.length > 1) {
    const m2 = metricas[1];
    insights.push({
      tipo: 'destacado',
      titulo: `Resumen de ${humanLabel(m2.col)}`,
      texto: `**Total:** ${m2.total.toLocaleString('es-CO')} · **Promedio:** ${m2.promedio.toLocaleString('es-CO')} · **Máximo:** ${m2.max.toLocaleString('es-CO')}`,
      icono: 'chart',
    });
  }

  return insights.slice(0, 6);
}

// ── KPI builder ───────────────────────────────────────────────────────────────
function buildKPIs(tipo, metricas) {
  const kpis = [];

  // Priorizar columnas con nombres de alto valor semántico
  const PRIORIDAD_KPI = ['goles', 'puntos', 'total', 'valor', 'venta', 'ingreso',
                          'salario', 'ganancia', 'produccion', 'ventas', 'unidades'];
  const metricasOrdenadas = [...metricas].sort((a, b) => {
    const lA = a.col.toLowerCase(), lB = b.col.toLowerCase();
    const rA = PRIORIDAD_KPI.findIndex(p => lA.includes(p));
    const rB = PRIORIDAD_KPI.findIndex(p => lB.includes(p));
    return (rA === -1 ? 999 : rA) - (rB === -1 ? 999 : rB);
  });

  for (const m of metricasOrdenadas.slice(0, 4)) {
    const esProm  = isTipoPromedio(m.col);
    const formato = detectarFormato(m.col);
    kpis.push({
      col:       m.col,
      label:     humanLabel(m.col),
      valor:     esProm ? m.promedio : m.total,
      sub_label: esProm ? 'Promedio' : 'Total',
      promedio:  m.promedio,
      min:       m.min,
      max:       m.max,
      formato,
    });
  }

  // KPI derivado: valor / cantidad → ticket / valor por unidad
  const mValor = metricas.find(m =>
    m.col.toLowerCase().includes('valor') || m.col.toLowerCase().includes('total')
    || m.col.toLowerCase().includes('monto') || m.col.toLowerCase().includes('venta')
  );
  const mCant = metricas.find(m =>
    ['cantidad','cant','qty','unidades','items','piezas'].some(p => m.col.toLowerCase() === p)
  );
  if (mValor && mCant && mCant.total > 0 && mValor.col !== mCant.col) {
    const ticketLabel = {
      rrhh: 'Costo por Empleado', inventario: 'Valor por Unidad',
      produccion: 'Costo por Unidad',
    }[tipo] || 'Ticket Promedio';
    kpis.push({
      col: '__ticket__', label: ticketLabel,
      valor:     Math.round((mValor.total / mCant.total) * 100) / 100,
      sub_label: 'Calculado',
      promedio: null, min: null, max: null,
      formato:  'moneda',
    });
  }

  return kpis;
}

// Columnas que representan atributos fijos (NO tendencias temporales)
const PATRONES_NO_TEMPORAL = [
  'edad', 'age', 'antiguedad', 'anos_experiencia', 'years_old',
  'experiencia', 'estatura', 'peso', 'altura', 'nivel', 'grado',
];
function esVariableNoTemporal(col) {
  const lc = col.toLowerCase();
  return PATRONES_NO_TEMPORAL.some(p => lc === p || lc.includes(p));
}

// ── Smart chart builder ───────────────────────────────────────────────────────
function buildGraficos(tipo, metricas, registros, colFecha, colCat, anio) {
  const graficos = [];
  if (metricas.length === 0) return graficos;
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const metP = metricas[0];

  // Agrega por mes usando sum o promedio según el tipo de columna
  function porMes(col) {
    const esProm = isTipoPromedio(col);
    const sum = {}, cnt = {};
    for (const r of registros) {
      const f = parseFecha(r[colFecha]);
      if (!f || f.anio !== anio) continue;
      const v = parseNum(r[col]);
      if (v === null) continue;
      sum[f.mes] = (sum[f.mes] || 0) + v;
      cnt[f.mes] = (cnt[f.mes] || 0) + 1;
    }
    const datos = Array(12).fill(null);
    for (const [mes, s] of Object.entries(sum)) {
      const idx = parseInt(mes) - 1;
      if (idx < 0 || idx >= 12) continue;
      datos[idx] = esProm
        ? Math.round((s / (cnt[mes] || 1)) * 100) / 100
        : Math.round(s * 100) / 100;
    }
    return datos;
  }

  // Agrega por categoría usando sum o promedio según el tipo de columna
  function porCat(col, topN = 10) {
    const esProm = isTipoPromedio(col);
    const sum = {}, cnt = {};
    for (const r of registros) {
      const cat = String(r[colCat] || '').trim();
      if (!cat) continue;
      const v = parseNum(r[col]);
      if (v === null) continue;
      sum[cat] = (sum[cat] || 0) + v;
      cnt[cat] = (cnt[cat] || 0) + 1;
    }
    return Object.entries(sum)
      .map(([nombre, s]) => ({
        nombre,
        total: esProm
          ? Math.round((s / (cnt[nombre] || 1)) * 100) / 100
          : Math.round(s * 100) / 100,
      }))
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, topN);
  }

  // ── 1. TEMPORAL ─────────────────────────────────────────────────────────────
  if (colFecha) {
    // Detectar granularidad: ¿los datos abarcan múltiples años?
    const _yearNow = new Date().getFullYear();
    const aniosEnDatos = [...new Set(
      registros.map(r => parseFecha(r[colFecha])?.anio)
        .filter(a => a && a >= 1900 && a <= _yearNow + 1)
    )].sort((a, b) => a - b);

    const rangoAnios = aniosEnDatos.length > 1
      ? aniosEnDatos[aniosEnDatos.length - 1] - aniosEnDatos[0]
      : 0;

    if (rangoAnios >= 2) {
      // ── Modo multi-año: agrupar por año (fechas históricas, nacimiento, etc.) ──
      const VENTANA = aniosEnDatos.slice(-20); // últimos 20 años de datos

      function porAnio(col) {
        const esProm = isTipoPromedio(col);
        const sum = {}, cnt = {};
        for (const r of registros) {
          const f = parseFecha(r[colFecha]);
          if (!f || !VENTANA.includes(f.anio)) continue;
          const v = parseNum(r[col]);
          if (v === null) continue;
          sum[f.anio] = (sum[f.anio] || 0) + v;
          cnt[f.anio] = (cnt[f.anio] || 0) + 1;
        }
        return VENTANA.map(a => {
          if (sum[a] === undefined) return null;
          return esProm
            ? Math.round((sum[a] / (cnt[a] || 1)) * 100) / 100
            : Math.round(sum[a] * 100) / 100;
        });
      }

      function contarPorAnio() {
        const cnt = {};
        for (const r of registros) {
          const f = parseFecha(r[colFecha]);
          if (!f || !VENTANA.includes(f.anio)) continue;
          cnt[f.anio] = (cnt[f.anio] || 0) + 1;
        }
        return VENTANA.map(a => cnt[a] || null);
      }

      const labelsAnios = VENTANA.map(String);

      // Siempre agregar gráfica de conteo por año
      const countDatos = contarPorAnio();
      if (countDatos.filter(v => v !== null && v > 0).length >= 2) {
        graficos.push({
          id:       'bar_anio_count',
          tipo:     'bar',
          categoria:'temporal',
          titulo:   `Registros por año — ${humanLabel(colFecha)}`,
          labels:   labelsAnios,
          datasets: [{ label: 'Registros', data: countDatos, formato: 'entero' }],
          span:     2,
        });
      }

      // Métricas numéricas por año (máx 2)
      for (const m of metricas.slice(0, 2)) {
        if (esVariableNoTemporal(m.col)) continue;
        const datos = porAnio(m.col);
        if (datos.filter(v => v !== null && v > 0).length < 2) continue;
        graficos.push({
          id:       `line_anio_${m.col}`,
          tipo:     'line',
          categoria:'temporal',
          titulo:   `${humanLabel(m.col)} por año`,
          labels:   labelsAnios,
          datasets: [{ label: humanLabel(m.col), data: datos, formato: detectarFormato(m.col) }],
          span:     1,
        });
      }

    } else {
      // ── Modo mensual: datos concentrados en uno o dos años ──────────────────
      const periodosConDatos = new Set(
        registros
          .map(r => parseFecha(r[colFecha]))
          .filter(f => f && f.anio === anio)
          .map(f => f.mes)
      );
      const numPeriodos = periodosConDatos.size;

      if (numPeriodos >= 2) {
        // Línea individual por métrica (máx 3)
        for (const m of metricas.slice(0, 3)) {
          if (esVariableNoTemporal(m.col)) continue;
          const esProm = isTipoPromedio(m.col);
          const datos  = porMes(m.col);
          const puntosReales = datos.filter(v => v !== null && v > 0).length;
          if (puntosReales < 2) continue;
          graficos.push({
            id:       `line_${m.col}`,
            tipo:     'line',
            categoria:'temporal',
            titulo:   esProm
              ? `Promedio mensual — ${humanLabel(m.col)}`
              : `Evolución mensual — ${humanLabel(m.col)}`,
            badge:    String(anio),
            labels:   MESES,
            datasets: [{ label: humanLabel(m.col), data: datos, formato: detectarFormato(m.col) }],
            span: 1,
          });
        }

        // Área combinada si 2+ métricas comparables
        const comp = metricas
          .filter(m => !esVariableNoTemporal(m.col))
          .filter((m, i) => i === 0 || sonComparables(metricas[0], m))
          .slice(0, 3);
        if (comp.length >= 2) {
          const ds = comp
            .map(m => ({ label: humanLabel(m.col), data: porMes(m.col) }))
            .filter(d => d.data.filter(v => v !== null && v > 0).length >= 2);
          if (ds.length >= 2) {
            graficos.push({
              id:       'area_comp',
              tipo:     'area',
              categoria:'temporal',
              titulo:   `Comparativo temporal — ${comp.slice(0,2).map(m=>humanLabel(m.col)).join(' vs ')}`,
              badge:    String(anio),
              labels:   MESES,
              datasets: ds.map((d, idx) => ({ ...d, formato: detectarFormato(comp[idx]?.col || '') })),
              span: 2,
            });
          }
        }
      }
    }
  }

  // ── 2. RANKING (barras horizontales) ────────────────────────────────────────
  if (colCat) {
    for (const m of metricas.slice(0, 2)) {
      const esProm   = isTipoPromedio(m.col);
      const entries  = porCat(m.col, 10);
      if (entries.length < 2) continue;
      graficos.push({
        id:       `ranking_${m.col}`,
        tipo:     'bar_h',
        categoria:'comparativo',
        titulo:   `Top ${entries.length} ${humanLabel(colCat)} — ${humanLabel(m.col)}`,
        badge:    'Ranking',
        labels:   entries.map(e => e.nombre),
        datasets: [{ label: `${esProm ? 'Promedio' : 'Total'} ${humanLabel(m.col)}`, data: entries.map(e => e.total), formato: detectarFormato(m.col) }],
        span: 1,
      });
    }
  }

  // ── 3. DISTRIBUCIÓN (pie / donut + polar) ────────────────────────────────────
  if (colCat) {
    const entries = porCat(metP.col, 8);
    if (entries.length >= 2) {
      // Pie para ≤5 categorías, Donut para más
      graficos.push({
        id:       `dist_${metP.col}`,
        tipo:     entries.length > 5 ? 'donut' : 'pie',
        categoria:'distribucion',
        titulo:   `Distribución de ${humanLabel(metP.col)} por ${humanLabel(colCat)}`,
        badge:    `Top ${entries.length}`,
        labels:   entries.map(e => e.nombre),
        datasets: [{ label: humanLabel(metP.col), data: entries.map(e => e.total), formato: detectarFormato(metP.col) }],
        span: 1,
      });

      // Polar solo si categorías son manejables (3-8)
      if (entries.length >= 3 && entries.length <= 8) {
        graficos.push({
          id:       `polar_${metP.col}`,
          tipo:     'polar',
          categoria:'distribucion',
          titulo:   `Polar — ${humanLabel(metP.col)} por ${humanLabel(colCat)}`,
          badge:    'Polar',
          labels:   entries.map(e => e.nombre),
          datasets: [{ label: humanLabel(metP.col), data: entries.map(e => e.total), formato: detectarFormato(metP.col) }],
          span: 1,
        });
      }
    }
  }

  // ── 4. COMPARATIVO MULTI-MÉTRICA (barras agrupadas) ─────────────────────────
  // Solo si hay 2+ métricas con escala compatible (ratio < 50×)
  if (colCat && metricas.length >= 2) {
    const metComp = [metricas[0], ...metricas.slice(1).filter(m => sonComparables(metricas[0], m))].slice(0, 3);
    if (metComp.length >= 2) {
      const topCats = porCat(metComp[0].col, 8).map(e => e.nombre);
      if (topCats.length >= 2) {
        const ds = metComp.map(m => {
          const esProm = isTipoPromedio(m.col);
          const sum = {}, cnt = {};
          for (const r of registros) {
            const cat = String(r[colCat] || '').trim();
            if (!cat || !topCats.includes(cat)) continue;
            const v = parseNum(r[m.col]);
            if (v === null) continue;
            sum[cat] = (sum[cat] || 0) + v;
            cnt[cat] = (cnt[cat] || 0) + 1;
          }
          return {
            label:   humanLabel(m.col),
            data:    topCats.map(cat => esProm && cnt[cat]
              ? Math.round((sum[cat] || 0) / cnt[cat] * 100) / 100
              : Math.round((sum[cat] || 0) * 100) / 100),
            formato: detectarFormato(m.col),
          };
        });
        graficos.push({
          id:       'multi_comp',
          tipo:     'bar',
          categoria:'comparativo',
          titulo:   `Comparativo — ${metComp.slice(0,2).map(m=>humanLabel(m.col)).join(' vs ')} por ${humanLabel(colCat)}`,
          badge:    'Multi',
          labels:   topCats,
          datasets: ds,
          span: 2,
        });
      }
    }
  }

  // ── 5. CORRELACIÓN (scatter) ─────────────────────────────────────────────────
  // Útil cuando dos columnas numéricas podrían tener una relación interesante
  if (metricas.length >= 2 && registros.length >= 10) {
    for (let i = 0; i < Math.min(metricas.length - 1, 3); i++) {
      const m1 = metricas[i];
      const m2 = metricas[i + 1];
      const clase1 = clasificarColumna(m1.col);
      const clase2 = clasificarColumna(m2.col);
      // Scatter es interesante cuando: escalas muy distintas O ambas son estadísticas
      const escalasDistintas = !sonComparables(m1, m2);
      const ambasEstadisticas = clase1 === 'estadistica' && clase2 === 'estadistica';
      if (!escalasDistintas && !ambasEstadisticas) continue;
      const pairs = registros
        .map(r => ({ x: parseNum(r[m1.col]), y: parseNum(r[m2.col]) }))
        .filter(p => p.x !== null && p.y !== null)
        .slice(0, 300);
      if (pairs.length < 10) continue;
      graficos.push({
        id:       `scatter_${m1.col}_${m2.col}`,
        tipo:     'scatter',
        categoria:'correlacion',
        titulo:   `Correlación: ${humanLabel(m1.col)} vs ${humanLabel(m2.col)}`,
        badge:    'Scatter',
        labels:   [],
        datasets: [{ label: `${humanLabel(m1.col)} vs ${humanLabel(m2.col)}`, data: pairs }],
        ejes:     { x: humanLabel(m1.col), y: humanLabel(m2.col) },
        span:     2,
        nota:     `${pairs.length} puntos analizados`,
      });
      break; // Máx 1 scatter por dataset para no saturar
    }
  }

  // ── 6. RADAR — solo si hay 3+ métricas y 3-15 categorías únicas ───────────
  // Valores normalizados a % del máximo de cada métrica para comparabilidad
  if (colCat && metricas.length >= 3) {
    const uniqueCats = new Set(registros.map(r => String(r[colCat] || '').trim()).filter(Boolean));
    if (uniqueCats.size >= 3 && uniqueCats.size <= 15) {
      const topCats = porCat(metricas[0].col, 8).map(e => e.nombre);
      if (topCats.length >= 3) {
        const ds = metricas.slice(0, 4).map(m => {
          const esProm = isTipoPromedio(m.col);
          const sum = {}, cnt = {};
          for (const r of registros) {
            const cat = String(r[colCat] || '').trim();
            if (!cat) continue;
            const v = parseNum(r[m.col]);
            if (v === null) continue;
            sum[cat] = (sum[cat] || 0) + v;
            cnt[cat] = (cnt[cat] || 0) + 1;
          }
          const vals = topCats.map(cat => esProm && cnt[cat]
            ? (sum[cat] || 0) / cnt[cat]
            : (sum[cat] || 0));
          const maxVal = Math.max(...vals, 1);
          return {
            label: humanLabel(m.col),
            data:  vals.map(v => Math.round((v / maxVal) * 100)),
          };
        });
        graficos.push({
          id:       'radar_perfil',
          tipo:     'radar',
          categoria:'comparativo',
          titulo:   `Radar — perfil por ${humanLabel(colCat)} (% normalizado)`,
          badge:    '% del máx',
          nota:     'Cada métrica normalizada al 100% de su máximo para comparabilidad',
          labels:   topCats,
          datasets: ds,
          span: 2,
        });
      }
    }
  }

  // ── 7. ANÁLISIS CATEGÓRICO (columnas de texto con valores repetidos) ──────────
  // Detecta columnas como posicion, resultado, ciudad, categoria y genera frecuencias
  if (registros.length >= 2) {
    const todasCols = Object.keys(registros[0] || {});
    const excluirCats = [colFecha, colCat].filter(Boolean);
    const colsTexto = detectarColumnasTexto(todasCols, registros, excluirCats);

    for (const colT of colsTexto.slice(0, 3)) {
      const freq = {};
      for (const r of registros) {
        const v = String(r[colT] || '').trim();
        if (v) freq[v] = (freq[v] || 0) + 1;
      }
      const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]);
      if (entries.length < 2) continue;

      const top10 = entries.slice(0, 10);
      const totalReg = registros.length;

      // Barra horizontal de frecuencia
      graficos.push({
        id:       `freq_${colT}`,
        tipo:     'bar_h',
        categoria:'distribucion',
        titulo:   `Frecuencia de ${humanLabel(colT)}`,
        badge:    `${entries.length} valores`,
        labels:   top10.map(([v]) => v),
        datasets: [{ label: 'Registros', data: top10.map(([, c]) => c), formato: 'entero' }],
        span:     1,
        nota:     `${totalReg} registros totales`,
      });

      // Pie/Donut si ≤10 valores únicos (distribución proporcional)
      if (entries.length <= 10) {
        graficos.push({
          id:       `pie_freq_${colT}`,
          tipo:     entries.length > 5 ? 'donut' : 'pie',
          categoria:'distribucion',
          titulo:   `Distribución de ${humanLabel(colT)}`,
          badge:    `${entries.length} categorías`,
          labels:   top10.map(([v]) => v),
          datasets: [{ label: 'Frecuencia', data: top10.map(([, c]) => c), formato: 'entero' }],
          span:     1,
        });
      }
    }
  }

  return graficos;
}

// ── GET /api/stats/dashboard ───────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const { dataset_ids } = req.query;
    let dsRes;

    if (dataset_ids) {
      const ids = dataset_ids.split(',').map(Number).filter(Boolean);
      dsRes = await query(
        `SELECT id, nombre, total_filas, columnas, tipo_dataset
         FROM datasets WHERE user_id = $1 AND id = ANY($2) ORDER BY created_at DESC`,
        [req.user.id, ids]
      );
    } else {
      dsRes = await query(
        `SELECT id, nombre, total_filas, columnas, tipo_dataset
         FROM datasets WHERE user_id = $1 ORDER BY created_at DESC`,
        [req.user.id]
      );
    }
    const datasets = dsRes.rows;

    // Sin datos
    if (datasets.length === 0) {
      return res.json({
        success: true,
        data: {
          tiene_datos: false, tipo_detectado: 'general',
          total_registros: 0, total_datasets: 0,
          anio: new Date().getFullYear(),
          col_fecha: null, col_categoria: null,
          kpis: [], graficos: [],
          metricas: [], series_temporales: [],
          distribucion: [], distribucion_por_col: [], columnas_numericas: [],
        },
      });
    }

    // Registros
    const ids = datasets.map(d => d.id);
    const regRes = await query(
      `SELECT datos FROM registros_datos WHERE dataset_id = ANY($1) ORDER BY fila_numero`,
      [ids]
    );
    const registros = regRes.rows.map(r => r.datos);

    // Columnas únicas
    const allCols = [...new Set(
      datasets.flatMap(d => Array.isArray(d.columnas) ? d.columnas : (d.columnas || []))
    )];

    // Tipo de dataset
    const tipoExplicito = datasets[0]?.tipo_dataset;
    const tipoDetectado = (tipoExplicito && tipoExplicito !== 'general')
      ? tipoExplicito
      : detectarTipo(allCols);

    // Columnas especiales
    const colFecha = detectCol(allCols, FECHA_KEYS);
    const colCat   = detectColCategoria(allCols);
    const colsNum  = detectarColumnasNumericas(allCols, registros, [colFecha, colCat].filter(Boolean));

    // Métricas base (usadas por buildKPIs y buildGraficos)
    const metricas = colsNum.map(col => {
      const valores = registros.map(r => parseNum(r[col])).filter(v => v !== null);
      if (valores.length === 0) return null;
      const total    = valores.reduce((a, b) => a + b, 0);
      const promedio = total / valores.length;
      return {
        col,
        label:    humanLabel(col),
        total:    Math.round(total * 100) / 100,
        promedio: Math.round(promedio * 100) / 100,
        min:      Math.round(Math.min(...valores) * 100) / 100,
        max:      Math.round(Math.max(...valores) * 100) / 100,
      };
    }).filter(Boolean).sort((a, b) => b.total - a.total);

    // Año predominante (filtrado a rango razonable)
    const _yrNow = new Date().getFullYear();
    let anio = _yrNow;
    if (colFecha) {
      const anios = registros.map(r => parseFecha(r[colFecha])?.anio)
        .filter(a => a && a >= 1900 && a <= _yrNow + 1);
      if (anios.length > 0) anio = Math.max(...anios);
    }

    // ── Motor inteligente: KPIs + gráficos + insights ────────────────────────
    const kpis     = buildKPIs(tipoDetectado, metricas);
    const graficos = buildGraficos(tipoDetectado, metricas, registros, colFecha, colCat, anio);
    const insights = buildInsights(metricas, registros, colCat, colFecha, anio);

    // ── Legacy: series temporales (compat con versión anterior) ───────────────
    const seriesTemporales = [];
    if (colFecha && metricas.length > 0) {
      const MESES_LEGACY = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      for (const m of metricas.slice(0, 4)) {
        const acum = {};
        for (const r of registros) {
          const f = parseFecha(r[colFecha]);
          if (!f || f.anio !== anio) continue;
          acum[f.mes] = (acum[f.mes] || 0) + (parseNum(r[m.col]) || 0);
        }
        const datos = Array(12).fill(0);
        for (const [mes, val] of Object.entries(acum)) {
          const idx = parseInt(mes) - 1;
          if (idx >= 0 && idx < 12) datos[idx] = Math.round(val * 100) / 100;
        }
        seriesTemporales.push({ col: m.col, label: m.label, datos });
      }
    }

    // Legacy: distribución
    let distribucion = [];
    if (colCat && metricas.length > 0) {
      const porCatLeg = {};
      for (const r of registros) {
        const cat = String(r[colCat] || '').trim();
        if (!cat) continue;
        porCatLeg[cat] = (porCatLeg[cat] || 0) + (parseNum(r[metricas[0].col]) || 0);
      }
      distribucion = Object.entries(porCatLeg)
        .map(([nombre, total]) => ({ nombre, total: Math.round(total * 100) / 100 }))
        .filter(d => d.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);
    }
    if (distribucion.length === 0 && metricas.length > 0) {
      distribucion = metricas.slice(0, 6).map(m => ({ nombre: m.label, total: m.total }));
    }

    // Legacy: distribucionPorCol
    const distribucionPorCol = [];
    if (colCat && metricas.length > 0) {
      for (const m of metricas.slice(0, 4)) {
        const pc = {};
        for (const r of registros) {
          const cat = String(r[colCat] || '').trim();
          if (!cat) continue;
          pc[cat] = (pc[cat] || 0) + (parseNum(r[m.col]) || 0);
        }
        const datos = Object.entries(pc)
          .map(([nombre, total]) => ({ nombre, total: Math.round(total * 100) / 100 }))
          .filter(d => d.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);
        if (datos.length > 0) distribucionPorCol.push({ col: m.col, label: m.label, datos });
      }
    }
    if (distribucionPorCol.length === 0 && metricas.length > 0) {
      distribucionPorCol.push({
        col: '__metricas__', label: 'Métricas generales',
        datos: metricas.slice(0, 8).map(m => ({ nombre: m.label, total: m.total })),
      });
    }

    return res.json({
      success: true,
      data: {
        tiene_datos:          true,
        tipo_detectado:       tipoDetectado,
        total_registros:      registros.length,
        total_datasets:       datasets.length,
        anio,
        col_fecha:            colFecha,
        col_categoria:        colCat,
        // Motor inteligente
        kpis,
        graficos,
        insights,
        // Legacy
        metricas:             metricas.slice(0, 4),
        series_temporales:    seriesTemporales,
        distribucion,
        distribucion_por_col: distribucionPorCol,
        columnas_numericas:   colsNum,
      },
    });

  } catch (err) {
    console.error('Error en getDashboardStats:', err);
    return res.status(500).json({ success: false, message: 'Error al calcular estadísticas' });
  }
};

module.exports = { getDashboardStats };
