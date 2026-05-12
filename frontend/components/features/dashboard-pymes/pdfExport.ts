// PDF export module using jsPDF + html2canvas
// Called from Dashboard when user clicks "Exportar PDF"

/* eslint-disable @typescript-eslint/no-explicit-any */

function fmtNum(n: number): string {
  if (n == null || isNaN(n)) return '0';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString('es-CO', { maximumFractionDigits: 2 });
}

function fmtValor(n: number, formato: string): string {
  if (n == null || isNaN(Number(n))) return '—';
  switch (formato) {
    case 'moneda':     return `$${fmtNum(n)}`;
    case 'porcentaje': return `${Number(n).toFixed(1)}%`;
    case 'entero':     return Math.round(n).toLocaleString('es-CO');
    default:           return fmtNum(n);
  }
}

export interface ExportPDFOptions {
  stats: any;
  kpis: any[];
  graficos: any[];
  insights: any[];
  user: { nombre: string; empresa_id?: number };
  tipoLabel: string;
  chartAnalysis: Record<string, { texto?: string; loading?: boolean; error?: string | null }>;
}

export async function exportarPDF(opts: ExportPDFOptions): Promise<void> {
  // Dynamic imports to avoid SSR issues
  const jsPDFModule = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;
  const jsPDF = jsPDFModule.default ?? (jsPDFModule as any).jsPDF;

  const { stats, kpis, graficos, insights, user, tipoLabel, chartAnalysis } = opts;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;

  let y = 0;
  let currentPage = 1;

  const addFooter = (page: number) => {
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `PYMES-AI Analytics  ·  Pagina ${page}`,
      pageW / 2, pageH - 8,
      { align: 'center' }
    );
    doc.setTextColor(0, 0, 0);
  };

  const maybeNewPage = (spaceNeeded: number): void => {
    if (y + spaceNeeded > pageH - 18) {
      addFooter(currentPage);
      doc.addPage();
      currentPage++;
      y = margin;
    }
  };

  // ── PORTADA ───────────────────────────────────────────────────────────────────
  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Franja naranja superior
  doc.setFillColor(255, 102, 0);
  doc.rect(0, 0, pageW, 5, 'F');

  // Franja naranja inferior
  doc.setFillColor(255, 102, 0);
  doc.rect(0, pageH - 5, pageW, 5, 'F');

  // Logo text
  y = 52;
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('PYMES-AI', pageW / 2, y, { align: 'center' });

  y += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 180, 160);
  doc.text('Reporte de Analisis Inteligente de Datos', pageW / 2, y, { align: 'center' });

  // Divisor
  y += 20;
  doc.setDrawColor(255, 102, 0);
  doc.setLineWidth(0.6);
  doc.line(margin + 15, y, pageW - margin - 15, y);

  // Nombre dataset
  y += 22;
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const nombreDataset = String(stats?.nombre_dataset ?? 'Todos los datasets');
  const dsLines = doc.splitTextToSize(nombreDataset, contentW - 10);
  doc.text(dsLines, pageW / 2, y, { align: 'center' });
  y += dsLines.length * 10;

  // Tipo detectado
  y += 4;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 140, 60);
  doc.text(`Tipo de datos: ${tipoLabel}`, pageW / 2, y, { align: 'center' });

  // Cajas de resumen
  y += 28;
  const boxW = (contentW - 8) / 3;
  const boxItems = [
    { label: 'Registros', value: (stats?.total_registros ?? 0).toLocaleString('es-CO') },
    { label: 'Graficas', value: String(graficos?.length ?? 0) },
    { label: 'Insights', value: String(insights?.length ?? 0) },
  ];
  boxItems.forEach((item, i) => {
    const bx = margin + i * (boxW + 4);
    doc.setFillColor(40, 40, 70);
    doc.roundedRect(bx, y, boxW, 26, 3, 3, 'F');
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 102, 0);
    doc.text(item.value, bx + boxW / 2, y + 13, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 185);
    doc.text(item.label, bx + boxW / 2, y + 21, { align: 'center' });
  });

  // Info usuario y fecha
  y = pageH - 34;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 200);
  doc.text(`Generado por: ${user?.nombre ?? 'Usuario'}`, pageW / 2, y, { align: 'center' });
  y += 8;
  const fechaGen = new Date().toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.text(`Fecha: ${fechaGen}`, pageW / 2, y, { align: 'center' });

  // Footer portada
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 100);
  doc.text('PYMES-AI Analytics  |  Fundacion Universitaria Compensar', pageW / 2, pageH - 10, { align: 'center' });

  // ── PAGINA 2: METRICAS KPI ────────────────────────────────────────────────────
  doc.addPage();
  currentPage++;
  y = margin;

  // Header sección
  doc.setFillColor(255, 102, 0);
  doc.rect(margin, y, contentW, 10, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('METRICAS PRINCIPALES', margin + 4, y + 7);
  y += 16;

  if (kpis && kpis.length > 0) {
    const colW = [contentW * 0.42, contentW * 0.2, contentW * 0.19, contentW * 0.19];
    const headers = ['Indicador', 'Valor Total', 'Promedio', 'Maximo'];
    const rowH = 8.5;

    // Cabecera tabla
    doc.setFillColor(245, 245, 248);
    doc.rect(margin, y, contentW, rowH, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 100);
    let cx = margin + 3;
    headers.forEach((h, i) => {
      doc.text(h, cx, y + 6);
      cx += colW[i];
    });
    y += rowH;

    // Filas
    kpis.forEach((kpi, idx) => {
      maybeNewPage(rowH + 2);
      doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 246);
      doc.rect(margin, y, contentW, rowH, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 30, 30);
      cx = margin + 3;
      const cells = [
        kpi.label ?? '',
        fmtValor(kpi.valor, kpi.formato),
        kpi.promedio != null ? fmtValor(kpi.promedio, kpi.formato) : '—',
        kpi.max != null ? fmtValor(kpi.max, kpi.formato) : '—',
      ];
      cells.forEach((cell, i) => {
        doc.text(String(cell), cx, y + 6);
        cx += colW[i];
      });
      y += rowH;
    });

    // Borde tabla completa
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.25);
    const tableH = (kpis.length + 1) * rowH;
    doc.rect(margin, y - tableH, contentW, tableH);
  } else {
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Sin metricas disponibles.', margin, y + 6);
    y += 12;
  }

  y += 14;

  // ── INSIGHTS ──────────────────────────────────────────────────────────────────
  if (insights && insights.length > 0) {
    maybeNewPage(22);

    doc.setFillColor(255, 102, 0);
    doc.rect(margin, y, contentW, 10, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('INSIGHTS AUTOMATICOS', margin + 4, y + 7);
    y += 16;

    const insightBg: Record<string, [number, number, number]> = {
      dominante:    [254, 243, 199],
      destacado:    [239, 246, 255],
      pico:         [236, 253, 245],
      outlier:      [254, 242, 242],
      alerta:       [254, 243, 199],
      variabilidad: [245, 243, 255],
    };

    for (const ins of insights) {
      const titulo = ins.titulo ?? '';
      const texto = (ins.texto ?? '').replace(/\*\*/g, '');
      const textoLines = doc.splitTextToSize(texto, contentW - 10);
      const blockH = 8 + textoLines.length * 4.5 + 4;

      maybeNewPage(blockH + 4);

      const bg = insightBg[ins.tipo] ?? insightBg.destacado;
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.roundedRect(margin, y, contentW, blockH, 2, 2, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(titulo, margin + 5, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(70, 70, 80);
      doc.text(textoLines, margin + 5, y + 12);

      y += blockH + 4;
    }
  }

  // ── GRAFICAS ──────────────────────────────────────────────────────────────────
  const chartEls = Array.from(document.querySelectorAll('[data-chart-id]')) as HTMLElement[];

  if (chartEls.length > 0) {
    addFooter(currentPage);
    doc.addPage();
    currentPage++;
    y = margin;

    doc.setFillColor(255, 102, 0);
    doc.rect(margin, y, contentW, 10, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('VISUALIZACIONES DE DATOS', margin + 4, y + 7);
    y += 16;

    for (const el of chartEls) {
      try {
        const canvas = await html2canvas(el, {
          scale: 1.8,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });

        const ratio = canvas.height / canvas.width;
        const imgW = contentW;
        const imgH = Math.min(imgW * ratio, 110);

        maybeNewPage(imgH + 10);

        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', margin, y, imgW, imgH);
        y += imgH + 4;

        // Análisis IA bajo la gráfica
        const chartId = el.dataset.chartId ?? '';
        const analisis = chartAnalysis[chartId];
        if (analisis?.texto) {
          const analText = `[IA] ${analisis.texto.replace(/\*\*/g, '')}`;
          const analLines = doc.splitTextToSize(analText, contentW - 6);
          const analH = analLines.length * 4 + 6;

          maybeNewPage(analH + 4);

          doc.setFillColor(255, 249, 245);
          doc.roundedRect(margin, y, contentW, analH, 1.5, 1.5, 'F');
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100, 80, 60);
          doc.text(analLines, margin + 3, y + 4.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          y += analH + 4;
        }

        y += 8;
      } catch (err) {
        console.warn('[pdfExport] Error capturando gráfica:', err);
      }
    }
  }

  // ── CONCLUSIONES ──────────────────────────────────────────────────────────────
  maybeNewPage(50);

  doc.setFillColor(255, 102, 0);
  doc.rect(margin, y, contentW, 10, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CONCLUSIONES AUTOMATICAS', margin + 4, y + 7);
  y += 16;

  const primerKpi = kpis?.[0];
  const primerInsight = insights?.[0];

  const conclusiones: string[] = [
    `El analisis de ${(stats?.total_registros ?? 0).toLocaleString('es-CO')} registros del dataset ` +
    `"${stats?.nombre_dataset ?? 'Sin nombre'}" revela un contexto de tipo "${tipoLabel}".`,

    primerKpi
      ? `El indicador principal "${primerKpi.label}" registra un valor acumulado de ` +
        `${fmtValor(primerKpi.valor, primerKpi.formato)}, promedio ` +
        `${fmtValor(primerKpi.promedio, primerKpi.formato)} y maximo ` +
        `${fmtValor(primerKpi.max, primerKpi.formato)}.`
      : '',

    primerInsight
      ? `Hallazgo destacado: ${primerInsight.titulo} — ${(primerInsight.texto ?? '').replace(/\*\*/g, '')}`
      : '',

    `Se generaron ${graficos?.length ?? 0} visualizaciones y ${insights?.length ?? 0} insights ` +
    `automaticos para apoyar la toma de decisiones estrategicas.`,

    `Reporte generado el ${new Date().toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric',
    })} mediante PYMES-AI Analytics.`,
  ].filter(Boolean);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(45, 45, 55);

  for (const c of conclusiones) {
    const lines = doc.splitTextToSize(c, contentW - 4);
    const h = lines.length * 6 + 5;
    maybeNewPage(h);
    doc.text(lines, margin + 2, y);
    y += h;
  }

  // Footer última página
  addFooter(currentPage);

  // Guardar
  const safeName = (stats?.nombre_dataset ?? 'reporte')
    .replace(/[^a-z0-9]/gi, '_')
    .substring(0, 40);
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`PYMES-AI_${safeName}_${dateStr}.pdf`);
}
