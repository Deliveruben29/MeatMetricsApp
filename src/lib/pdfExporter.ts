import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IncidentRecord } from './incidentsService';

/**
 * Exporta una lista de incidencias a un documento PDF profesional.
 */
export const exportToPDF = (incidents: IncidentRecord[]) => {
  // Configuración de documento en formato A4 Horizontal (Landscape)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const dateStr = new Date().toLocaleDateString();

  // 1. Encabezado con branding
  doc.setFillColor(220, 38, 38); // Rojo MeatMetrics
  doc.rect(0, 0, pageWidth, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('MEATMETRICS', 15, 17);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte Operacional de Incidencias', 15, 22);

  doc.text(`Fecha de Reporte: ${dateStr}`, pageWidth - 15, 15, { align: 'right' });

  // 2. Resumen rápido
  const totalMins = incidents.reduce((acc, curr) => acc + (curr.total_minutos || 0), 0);
  const totalPollos = incidents.reduce((acc, curr) => acc + (curr.pollos_no_colgados || 0), 0);

  doc.setTextColor(30, 41, 59); // Slate-800
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Resumen: ${incidents.length} registros | ${totalMins} min. parados acumulados | ${totalPollos} unidades no colgadas`, 15, 35);

  // 3. Tabla de Datos
  const tableColumn = [
    'Fecha', 
    'Turno', 
    'Sección / Sub-sección', 
    'Incidencia', 
    'Minutos', 
    'Pollos', 
    'Rendimiento', 
    'Estado'
  ];

  const tableRows = incidents.map(item => [
    item.fecha,
    item.turno,
    `${item.seccion.toUpperCase()}\n${item.subseccion}`,
    item.tipo_incidencia,
    `${item.total_minutos} min`,
    `${item.pollos_no_colgados || 0}`,
    item.rendimiento_pct !== null ? `${item.rendimiento_pct}%` : '—',
    item.estatus
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 50 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 25, halign: 'center' },
      7: { cellWidth: 35, halign: 'center' }
    },
    didParseCell: (data) => {
      // Pintar celdas de estado con colores
      if (data.section === 'body' && data.column.index === 7) {
        const value = data.cell.raw;
        if (value === '✅ Resuelto') {
          data.cell.styles.textColor = [21, 128, 61]; // Verde
        } else if (value === '🔴 Crítico') {
          data.cell.styles.textColor = [185, 28, 28]; // Rojo
          data.cell.styles.fontStyle = 'bold';
        } else if (value === '⚠️ Pendiente') {
          data.cell.styles.textColor = [180, 83, 9]; // Amber
        }
      }
      
      // Pintar rendimiento bajo
      if (data.section === 'body' && data.column.index === 6) {
        const val = data.cell.raw as string;
        if (val.includes('%')) {
          const pct = parseInt(val);
          if (pct < 80) data.cell.styles.textColor = [185, 28, 28];
        }
      }
    },
    margin: { top: 40 },
  });

  // 4. Pie de página
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(
      `Página ${i} de ${totalPages} - Generado por MeatMetrics Production System`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Descarga el archivo
  const safeFileName = `Reporte_MeatMetrics_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFileName);
};
