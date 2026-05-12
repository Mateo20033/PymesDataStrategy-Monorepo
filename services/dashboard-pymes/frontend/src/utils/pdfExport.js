/**
 * pdfExport.js
 * Genera un reporte PDF completo del dashboard usando jsPDF + html2canvas.
 * Importación dinámica para no inflar el bundle inicial.
 */

const PAGE_W    = 210;
const PAGE_H    = 297;
const MARGIN    = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Paleta
const INDIGO = [79, 70, 229];
const WHITE  = [255, 255, 255];
const DARK   = [17, 24, 39];
const GRAY   = [107, 114, 128];
const LIGHT  = [248, 250, 252];
const BORDER = [226, 232, 240];

// ── Helpers de layout ─────────────────────────────────────────────────────────

function checkPage(doc, y, needed = 40) {
  if (y + needed > PAGE_H - 18) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function sectionTitle(doc, title, y) {
  doc.setFillColor(...INDIGO);
  doc.rect(MARGIN, y, 4, 10, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...INDIGO);
  doc.text(title, MARGIN + 8, y + 7.5);
  return y + 17;
}

function addFooters(doc, totalPages) {
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...LIGHT);
    doc.rect(0, PAGE_H - 11, PAGE_W, 11, 'F');
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(0, PAGE_H - 11, PAGE_W, PAGE_H - 11);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    doc.text('PYMES-AI · Motor de análisis de datos empresariales', MARGIN, PAGE_H - 4.5);
    doc.text(`Página ${i} de ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 4.5, { align: 'right' });
  }
}

// ── Conclusión auto-generada ──────────────────────────────────────────────────

function generarConclusion(stats, kpis, insights, tipoLabel) {
  const tipo      = tipoLabel || 'General';
  const registros = (stats.total_registros || 0).toLocaleString('es-CO');
  const numDs     = stats.total_datasets || 1;
  const fmt       = (n) => n != null
    ? Number(n).toLocaleString('es-CO', { maximumFractionDigits: 2 })
    : '—';

  const partes = [
    `El análisis de datos de tipo ${tipo} procesó ${registros} registros en ${numDs} dataset(s).`,
  ];

  if (kpis.length > 0) {
    const k = kpis[0];
    partes.push(
      `La métrica principal "${k.label}" registra un valor de ${fmt(k.valor)} `
      + `(${(k.sub_label || '').toLowerCase()}), con promedio de ${fmt(k.promedio)} `
      + `y máximo de ${fmt(k.max)}.`
    );
  }

  const pico = insights.find(i => i.tipo === 'pico');
  const dom  = insights.find(i => ['dominante', 'destacado'].includes(i.tipo));
  const out  = insights.find(i => i.tipo === 'outlier');
  if (pico) partes.push(pico.texto.replace(/\*\*/g, ''));
  if (dom)  partes.push(dom.texto.replace(/\*\*/g, ''));
  if (out)  partes.push(`Se detectaron anomalías: ${out.texto.replace(/\*\*/g, '')}`);

  partes.push(
    'Se recomienda revisar las tendencias temporales y el análisis por categorías '
    + 'para tomar decisiones empresariales informadas.'
  );
  return partes.join(' ');
}

// ── Función principal ─────────────────────────────────────────────────────────

export async function exportarPDF({ stats, kpis, graficos, insights, user, tipoLabel, chartAnalysis = {} }) {
  const [{ jsPDF }, h2cModule] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  const html2canvas = h2cModule.default;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ══════════════════════════════════════════════════════════════════════════
  // PORTADA
  // ══════════════════════════════════════════════════════════════════════════
  doc.setFillColor(...INDIGO);
  doc.rect(0, 0, PAGE_W, 68, 'F');

  // Decoración geométrica
  doc.setFillColor(255, 255, 255);
  doc.setGState(new doc.GState({ opacity: 0.06 }));
  doc.circle(195, 20, 28, 'F');
  doc.circle(185, 55, 16, 'F');
  doc.setGState(new doc.GState({ opacity: 1 }));

  // PYMES-AI
  doc.setTextColor(...WHITE);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('PYMES·AI', MARGIN, 38);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Motor de Análisis de Datos para PYMES', MARGIN, 52);

  // Nombre del dataset
  doc.setTextColor(...DARK);
  doc.setFontSize(19);
  doc.setFont('helvetica', 'bold');
  const dsName  = stats.nombre_dataset || 'Reporte de Análisis';
  const dsLines = doc.splitTextToSize(dsName, CONTENT_W);
  doc.text(dsLines, MARGIN, 86);

  doc.setDrawColor(...INDIGO);
  doc.setLineWidth(1.2);
  doc.line(MARGIN, 91 + dsLines.length * 8, MARGIN + 44, 91 + dsLines.length * 8);

  // Tarjeta de metadatos
  const cardY = 96 + dsLines.length * 8;
  doc.setFillColor(...LIGHT);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, cardY, CONTENT_W, 58, 3, 3, 'FD');

  const fecha = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const metaRows = [
    ['Fecha de generación', fecha],
    ['Empresario',          user?.nombre    || 'Usuario'],
    ['Tipo de datos',       tipoLabel       || 'General'],
    ['Registros analizados',(stats.total_registros || 0).toLocaleString('es-CO')],
    ['Datasets',            String(stats.total_datasets || 1)],
    ['Gráficas generadas',  String(graficos.length)],
  ];
  doc.setFontSize(9);
  metaRows.forEach(([label, value], i) => {
    const ry = cardY + 10 + i * 8;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GRAY);
    doc.text(label, MARGIN + 5, ry);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(String(value), MARGIN + 56, ry);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // MÉTRICAS
  // ══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  let y = MARGIN;
  y = sectionTitle(doc, 'Métricas Principales', y);

  if (kpis.length > 0) {
    const COL_W = [76, 36, 36, 26];
    const HDRS  = ['Indicador', 'Valor principal', 'Promedio', 'Máximo'];
    const ROW_H = 9;
    const fmt   = (n) => n != null
      ? Number(n).toLocaleString('es-CO', { maximumFractionDigits: 2 })
      : '—';

    doc.setFillColor(...INDIGO);
    doc.rect(MARGIN, y, CONTENT_W, ROW_H, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    let cx = MARGIN + 2;
    HDRS.forEach((h, i) => { doc.text(h, cx, y + 6); cx += COL_W[i]; });
    y += ROW_H;

    kpis.forEach((k, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 249 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
      doc.rect(MARGIN, y, CONTENT_W, ROW_H, 'F');
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      cx = MARGIN + 2;
      [k.label, fmt(k.valor), fmt(k.promedio), fmt(k.max)].forEach((v, j) => {
        doc.text(String(v).slice(0, j === 0 ? 34 : 16), cx, y + 6);
        cx += COL_W[j];
      });
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.2);
      doc.line(MARGIN, y + ROW_H, MARGIN + CONTENT_W, y + ROW_H);
      y += ROW_H;
    });
    y += 8;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ══════════════════════════════════════════════════════════════════════════
  y = checkPage(doc, y, 40);
  y = sectionTitle(doc, 'Insights Detectados Automáticamente', y);

  const INS_BG = {
    dominante:   [254, 243, 199], pico:    [209, 250, 229],
    destacado:   [239, 246, 255], outlier: [254, 226, 226],
    variabilidad:[245, 243, 255], alerta:  [254, 243, 199],
  };
  const INS_FG = {
    dominante:   [180, 83, 9],   pico:    [6, 95, 70],
    destacado:   [29, 78, 216],  outlier: [185, 28, 28],
    variabilidad:[109, 40, 217], alerta:  [180, 83, 9],
  };

  if (insights.length > 0) {
    for (const ins of insights) {
      const cleanText = ins.texto.replace(/\*\*/g, '');
      const lines     = doc.splitTextToSize(cleanText, CONTENT_W - 12);
      const blockH    = 8 + lines.length * 4.8 + 4;
      y = checkPage(doc, y, blockH + 4);

      const bg = INS_BG[ins.tipo] || INS_BG.destacado;
      const fg = INS_FG[ins.tipo] || INS_FG.destacado;

      doc.setFillColor(...bg);
      doc.setDrawColor(...fg);
      doc.setLineWidth(0.5);
      doc.roundedRect(MARGIN, y, CONTENT_W, blockH, 2, 2, 'FD');

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...fg);
      doc.text(`${ins.titulo}`, MARGIN + 5, y + 6);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK);
      doc.text(lines, MARGIN + 5, y + 12);
      y += blockH + 5;
    }
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text('No se detectaron insights para este conjunto de datos.', MARGIN, y);
    y += 10;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GRÁFICAS
  // ══════════════════════════════════════════════════════════════════════════
  if (graficos.length > 0) {
    doc.addPage();
    y = MARGIN;
    y = sectionTitle(doc, 'Análisis Gráfico', y);

    const chartEls = document.querySelectorAll('[data-chart-id]');
    let chartNum   = 0;

    for (const el of chartEls) {
      const chartId = el.getAttribute('data-chart-id');
      const grafico = graficos.find(g => g.id === chartId);

      try {
        const canvas  = await html2canvas(el, {
          scale: 1.8, useCORS: true,
          backgroundColor: '#ffffff', logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        const ratio   = canvas.height / canvas.width;
        const imgW    = CONTENT_W;
        const imgH    = Math.min(imgW * ratio, 90);

        y = checkPage(doc, y, imgH + 20);
        chartNum++;

        // Título de la gráfica
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        if (grafico) doc.text(`${chartNum}. ${grafico.titulo}`, MARGIN, y);
        y += 5;

        // Imagen
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.3);
        doc.roundedRect(MARGIN, y, imgW, imgH, 2, 2, 'D');
        doc.addImage(imgData, 'PNG', MARGIN, y, imgW, imgH);
        y += imgH + 4;

        // Análisis IA si existe
        const analisisKey = grafico?.id;
        const analisisTxt = chartAnalysis[analisisKey]?.texto;
        if (analisisTxt) {
          const aLines = doc.splitTextToSize(`Análisis IA: ${analisisTxt}`, CONTENT_W - 8);
          const aH     = aLines.length * 4.4 + 8;
          doc.setFillColor(238, 242, 255);
          doc.setDrawColor(...INDIGO);
          doc.setLineWidth(0.3);
          doc.roundedRect(MARGIN, y, CONTENT_W, aH, 2, 2, 'FD');
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(55, 48, 163);
          doc.text(aLines, MARGIN + 4, y + 6);
          y += aH + 5;
        } else {
          y += 4;
        }
      } catch {
        // chart capture failed — skip silently
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONCLUSIONES
  // ══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = MARGIN;
  y = sectionTitle(doc, 'Conclusiones del Análisis', y);

  const conclusion      = generarConclusion(stats, kpis, insights, tipoLabel);
  const conclusionLines = doc.splitTextToSize(conclusion, CONTENT_W - 8);
  const conclusionH     = conclusionLines.length * 5.5 + 14;

  doc.setFillColor(...LIGHT);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, conclusionH, 3, 3, 'FD');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  doc.text(conclusionLines, MARGIN + 5, y + 9);

  // ── Footers en todas las páginas ──────────────────────────────────────────
  addFooters(doc, doc.internal.getNumberOfPages());

  // ── Guardar ───────────────────────────────────────────────────────────────
  const fecha_archivo = new Date().toISOString().slice(0, 10);
  doc.save(`Reporte-PYMES-AI-${fecha_archivo}.pdf`);
}
