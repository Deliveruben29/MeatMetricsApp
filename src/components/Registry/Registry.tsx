import React from 'react';
import { Search, Filter, Download, Edit2, MoreVertical } from 'lucide-react';

const mockIncidents = [
  { id: '1', date: '2026-04-01', shift: 'Mañana', section: 'Despiece', sub_section: 'Línea 1', type: 'Mecánica', status: 'Resuelto', duration: '45 min' },
  { id: '2', date: '2026-04-01', shift: 'Mañana', section: 'Envasado', sub_section: 'Termoformadora', type: 'Eléctrica', status: 'Pendiente', duration: '120 min' },
  { id: '3', date: '2026-03-31', shift: 'Tarde', section: 'Logística', sub_section: 'Cinta 4', type: 'Atasco', status: 'Resuelto', duration: '15 min' },
];

export default function Registry() {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Registro Maestro</h2>
          <p className="text-slate-500 mt-1">Histórico completo de incidencias y paros de planta.</p>
        </div>
        <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all">
          <Download className="w-5 h-5" />
          Exportar PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por sección..."
                className="bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-red-500/20 outline-none"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all">
              <Filter className="w-4 h-4" />
              Filtros Avanzados
            </button>
          </div>
          <p className="text-sm text-slate-500 font-medium">Mostrando {mockIncidents.length} resultados</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha / Turno</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Sección / Sub-sección</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de Incidencia</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Duración</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockIncidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{incident.date}</p>
                    <p className="text-xs text-slate-500">{incident.shift}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">{incident.section}</p>
                    <p className="text-xs text-slate-500">{incident.sub_section}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                      {incident.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">
                    {incident.duration}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      incident.status === 'Resuelto' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
