/**
 * excelExporter.ts
 * Exportación a Excel usando SheetJS (xlsx) — ya incluido en el proyecto.
 */
import * as XLSX from 'xlsx';
import { ReportRow } from './types';

const TURNO_LABELS: Record<string, string> = {
  TM: 'Mañana',
  TT: 'Tarde',
  TN: 'Noche',
};

export function exportToExcel(rows: ReportRow[], filename = 'Reporte_MeatMetrics.xlsx'): void {
  const wb = XLSX.utils.book_new();

  // ─── Fila de título ──────────────────────────────────────────────────
  const titleRow = [
    ['CONTROL DE PRODUCCIÓN — SALA DE DESPIECE', '', '', '', '', '', '', '', '', '', '', ''],
    ['Generado por MeatMetrics', '', '', '', '', new Date().toLocaleDateString('es-ES'), '', '', '', '', '', ''],
    [], // fila vacía
  ];

  // ─── Cabeceras oficiales del modelo de la jefa ───────────────────────
  const headers = [
    'FECHA', 'TURNO', 'SECCIÓN', 'SUB-SECCIÓN',
    'TIPO DE INCIDENCIA', 'DESCRIPCIÓN DE LA AVERÍA',
    'INICIO PARO', 'FIN PARO', 'TOTAL MINUTOS',
    'POLLOS NO COLGADOS', 'RENDIMIENTO (%)', 'ESTATUS',
  ];

  // ─── Filas de datos ──────────────────────────────────────────────────
  const dataRows = rows.map(row => {
    const rend = row.rendimientoPct !== null ? `${row.rendimientoPct}%` : '—';
    const rendFlag = row.rendimientoPct !== null && row.rendimientoPct < 80 ? ' ⚠️' : '';
    return [
      row.fecha,
      TURNO_LABELS[row.turno] ?? row.turno,
      row.seccion,
      row.subseccion,
      row.tipoIncidencia,
      row.descripcionAveria,
      row.inicioParo || '—',
      row.finParo || '—',
      row.totalMinutos,
      row.pollosNoColgados || 0,
      rend + rendFlag,
      row.estatus,
    ];
  });

  // ─── Fila de totales ─────────────────────────────────────────────────
  const totalMinutos = rows.reduce((s, r) => s + r.totalMinutos, 0);
  const totalPollos = rows.reduce((s, r) => s + (r.pollosNoColgados || 0), 0);
  const rendRows = rows.filter(r => r.rendimientoPct !== null);
  const avgRend = rendRows.length > 0
    ? (rendRows.reduce((s, r) => s + (r.rendimientoPct ?? 0), 0) / rendRows.length).toFixed(1) + '%'
    : '—';

  const totalsRow = ['TOTAL', '', '', '', '', '', '', '', totalMinutos, totalPollos, avgRend, ''];

  // ─── Combinar todas las filas ─────────────────────────────────────────
  const allRows = [
    ...titleRow,
    headers,
    ...dataRows,
    [],
    totalsRow,
  ];

  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // ─── Anchos de columna ────────────────────────────────────────────────
  ws['!cols'] = [
    { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 18 },
    { wch: 20 }, { wch: 46 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 16 },
  ];

  // ─── Merge de la celda del título ─────────────────────────────────────
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'AVERIAS');

  // ─── Generar y descargar ──────────────────────────────────────────────
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
