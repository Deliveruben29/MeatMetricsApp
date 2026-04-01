import React, { useEffect, useState } from 'react';
import { Search, Filter, Download, Trash2, MoreVertical, RefreshCw, AlertTriangle } from 'lucide-react';
import { fetchIncidents, IncidentRecord, deleteIncident, clearAllIncidents } from '@/src/lib/incidentsService';
import { exportToPDF } from '@/src/lib/pdfExporter';
import { cn } from '@/src/lib/utils';

export default function Registry() {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadIncidents = async () => {
    setLoading(true);
    const { data, error } = await fetchIncidents();
    if (!error) {
      setIncidents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este registro?')) {
      const { error } = await deleteIncident(id);
      if (!error) loadIncidents();
      else alert('Error: ' + error);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('⚠️ ADVERTENCIA: Se borrarán TODOS los registros del historial. Esta acción no se puede deshacer. ¿Deseas continuar?')) {
      const { error } = await clearAllIncidents();
      if (!error) loadIncidents();
      else alert('Error: ' + error);
    }
  };

  const filteredIncidents = incidents.filter(incident => 
    incident.seccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.descripcion_averia?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      // Pequeño delay para feedback visual
      await new Promise(r => setTimeout(r, 500));
      exportToPDF(filteredIncidents);
    } catch (err) {
      console.error('Error exportando PDF:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Registro Maestro</h2>
          <p className="text-slate-500 mt-1">Histórico completo de incidencias y paros de planta.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleClearAll}
            title="Borrar todo el historial"
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl font-bold hover:bg-red-100 transition-colors text-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            Limpiar Registro
          </button>
          
          <button 
            onClick={loadIncidents}
            title="Refrescar datos"
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button 
            onClick={handleExportPDF}
            disabled={exporting || filteredIncidents.length === 0}
            title="Exportar a PDF"
            className={cn(
              "bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-slate-200 transition-all",
              (exporting || filteredIncidents.length === 0) ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-800"
            )}
          >
            <Download className={cn("w-5 h-5", exporting && "animate-bounce")} />
            {exporting ? 'Generando...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por sección o avería..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-red-500/20 outline-none w-64 md:w-80"
              />
            </div>
            <button 
              title="Filtros avanzados"
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
            >
              <Filter className="w-4 h-4" />
              Filtros Avanzados
            </button>
          </div>
          <p className="text-sm text-slate-500 font-medium whitespace-nowrap">
            {loading ? 'Cargando...' : `Mostrando ${filteredIncidents.length} resultados`}
          </p>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha / Turno</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Sección / Sub-sección</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de Incidencia</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Duración</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Pollos</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Rendimiento</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && filteredIncidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{incident.fecha}</p>
                    <p className="text-xs text-slate-500">{incident.turno}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800 uppercase">{incident.seccion}</p>
                    <p className="text-xs text-slate-500">{incident.subseccion}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                      {incident.tipo_incidencia}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600 text-center">
                    {incident.total_minutos} min
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                      {incident.pollos_no_colgados || 0} u.
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {incident.rendimiento_pct !== null ? (
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        (incident.rendimiento_pct || 0) < 80 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {incident.rendimiento_pct}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      incident.estatus === '✅ Resuelto' 
                        ? 'bg-green-100 text-green-700' 
                        : (incident.estatus === '🔴 Crítico' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')
                    }`}>
                      {incident.estatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDelete(incident.id)}
                        title="Eliminar registro"
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        title="Más opciones"
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredIncidents.length === 0 && (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p>No se encontraron incidencias en el registro.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
