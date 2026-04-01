import React, { useState } from 'react';
import { Download, RefreshCw, Save } from 'lucide-react';
import { MeatMetricsLog, ReportRow, TipoIncidencia, Estatus } from '@/src/lib/types';
import { exportToExcel } from '@/src/lib/excelExporter';
import { saveIncidents } from '@/src/lib/incidentsService';

interface ReportGeneratorProps {
  records: MeatMetricsLog[];
}

const TIPO_OPTIONS: TipoIncidencia[] = ['Mecánica', 'Eléctrica', 'Pausa', 'Otros'];
const ESTATUS_OPTIONS: Estatus[] = ['✅ Resuelto', '⚠️ Pendiente', '🔴 Crítico'];

const TURNO_COLORS: Record<string, string> = {
  TM: 'bg-amber-100 text-amber-800',
  TT: 'bg-orange-100 text-orange-800',
  TN: 'bg-slate-200 text-slate-700',
};

const TURNO_LABEL: Record<string, string> = {
  TM: 'Mañana',
  TT: 'Tarde',
  TN: 'Noche',
};

function logsToReportRows(logs: MeatMetricsLog[]): ReportRow[] {
  return logs.map(log => ({
    id: crypto.randomUUID(),
    fecha: log.fecha,
    turno: log.turno,
    seccion: log.seccion,
    subseccion: log.seccion, 
    tipoIncidencia: 'Mecánica' as TipoIncidencia,
    descripcionAveria: log.causaAveria,
    inicioParo: '',
    finParo: '',
    totalMinutos: log.minutosParo,
    rendimientoPct: log.minutosParo > 0
      ? Math.max(0, Math.round((1 - log.minutosParo / 480) * 100)) 
      : null,
    pollosNoColgados: log.pollosNoColgados || 0,
    estatus: '✅ Resuelto' as Estatus,
    origenArchivo: log.origenArchivo,
  }));
}

export default function ReportGenerator({ records }: ReportGeneratorProps) {
  const [rows, setRows] = useState<ReportRow[]>(() => logsToReportRows(records));
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ count: number; error: string | null } | null>(null);
  const [synced, setSynced] = useState(false);

  const handleSync = () => {
    setRows(logsToReportRows(records));
    setSynced(true);
    setTimeout(() => setSynced(false), 2000);
  };

  const updateRow = <K extends keyof ReportRow>(id: string, field: K, value: ReportRow[K]) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleExport = () => {
    setExporting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      exportToExcel(rows, `Reporte_MeatMetrics_${today}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveResult(null);
    try {
      const result = await saveIncidents(rows);
      setSaveResult(result);
    } catch (err: any) {
      console.error('[ReportGenerator] Error fatal al guardar:', err);
      setSaveResult({ count: 0, error: err.message || 'Error de conexión inesperado' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveResult(null), 8000);
    }
  };

  const totalMinutos = rows.reduce((s, r) => s + r.totalMinutos, 0);
  const totalPollos = rows.reduce((s, r) => s + (r.pollosNoColgados || 0), 0);
  const avgRendimiento = rows.length > 0
    ? rows.filter(r => r.rendimientoPct !== null).reduce((s, r) => s + (r.rendimientoPct ?? 0), 0) /
      Math.max(1, rows.filter(r => r.rendimientoPct !== null).length)
    : null;

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
          <Download className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-slate-500 font-medium">Importa archivos primero para generar el reporte.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Vista Espejo — Reporte Oficial</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {rows.length} incidencias · {totalMinutos} min parados · {totalPollos} pollos
            {avgRendimiento !== null && ` · Rendimiento medio: ${avgRendimiento.toFixed(1)}%`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleSync}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${synced ? 'text-green-600' : ''}`} />
            {synced ? 'Sincronizado ✓' : 'Sincronizar'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || rows.length === 0}
            className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-slate-900 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando…' : 'Guardar en BD'}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || rows.length === 0}
            className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md shadow-red-200 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Generando…' : 'Generar Reporte Excel'}
          </button>
        </div>
      </div>

      {saveResult && (
        <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${
          saveResult.error ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {saveResult.error ? `❌ Error al guardar: ${saveResult.error}` : `✅ ${saveResult.count} incidencias guardadas correctamente.`}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[65vh]">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-red-600 text-white">
                {['FECHA','TURNO','SECCIÓN','SUB-SECCIÓN','TIPO','DESCRIPCIÓN','INICIO','FIN','MIN','POLLOS','REND','ESTATUS'].map(h => (
                  <th key={h} className="px-3 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-center">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => {
                const rendBad = row.rendimientoPct !== null && row.rendimientoPct < 80;
                const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
                return (
                  <tr key={row.id} className={`${rowBg} hover:bg-red-50/30 transition-colors`}>
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-slate-800">{row.fecha}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${TURNO_COLORS[row.turno]}`}>
                        {row.turno}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-600">{row.seccion}</td>
                    <td className="px-3 py-2">
                      <input
                        aria-label="Sub-sección"
                        title="Sub-sección"
                        className="w-24 text-xs border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-red-400/30 outline-none"
                        value={row.subseccion}
                        onChange={e => updateRow(row.id, 'subseccion', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                       <select
                        value={row.tipoIncidencia}
                        onChange={e => updateRow(row.id, 'tipoIncidencia', e.target.value as TipoIncidencia)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-medium"
                        aria-label="Tipo"
                      >
                        {TIPO_OPTIONS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      <p className="text-slate-700 text-xs line-clamp-1" title={row.descripcionAveria}>{row.descripcionAveria}</p>
                    </td>
                    <td className="px-2 py-2">
                      <input type="time" aria-label="Inicio" className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none" value={row.inicioParo} onChange={e => updateRow(row.id, 'inicioParo', e.target.value)} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="time" aria-label="Fin" className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none" value={row.finParo} onChange={e => updateRow(row.id, 'finParo', e.target.value)} />
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-red-600">{row.totalMinutos}</td>
                    <td className="px-3 py-2 text-center font-bold text-indigo-600">{row.pollosNoColgados}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${rendBad ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {row.rendimientoPct}%
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.estatus}
                        onChange={e => updateRow(row.id, 'estatus', e.target.value as Estatus)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-medium"
                        aria-label="Estatus"
                      >
                        {ESTATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 bg-slate-100 border-t-2 border-slate-300 font-bold">
              <tr>
                <td colSpan={8} className="px-3 py-3 text-xs text-slate-600 uppercase">Totales</td>
                <td className="px-3 py-3 text-center text-red-600">{totalMinutos}</td>
                <td className="px-3 py-3 text-center text-indigo-600">{totalPollos}</td>
                <td className="px-3 py-3 text-center">
                  {avgRendimiento !== null && (
                    <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700">{avgRendimiento.toFixed(1)}%</span>
                  )}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
