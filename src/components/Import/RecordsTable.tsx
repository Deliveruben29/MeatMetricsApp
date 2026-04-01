import React from 'react';
import { MeatMetricsLog } from '@/src/lib/types';

interface RecordsTableProps {
  records: MeatMetricsLog[];
}

export function RecordsTable({ records }: RecordsTableProps) {
  if (records.length === 0) return null;

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 className="font-bold text-slate-800">Previsualización de Registros ({records.length})</h3>
      </div>
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Turno</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sección</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Minutos</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Avería / Comentario</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Archivo Origen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r, i) => (
              <tr key={r.id || i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{r.fecha}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                    r.turno === 'TM' ? 'bg-amber-100 text-amber-700' :
                    r.turno === 'TT' ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {r.turno}
                  </span>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">{r.seccion}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-red-600">{r.minutosParo}</td>
                <td className="px-6 py-3 text-sm text-slate-600 max-w-sm truncate" title={r.causaAveria}>{r.causaAveria}</td>
                <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-400 font-medium" title={r.origenArchivo}>
                  {r.origenArchivo ? (r.origenArchivo.length > 25 ? r.origenArchivo.substring(0, 25) + '...' : r.origenArchivo) : 'Desconocido'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
