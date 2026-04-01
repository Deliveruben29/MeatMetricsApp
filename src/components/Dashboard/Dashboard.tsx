import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, Clock, Bird, RefreshCcw } from 'lucide-react';
import { KPICard } from './KPICard';
import { ChartsArea } from './ChartsArea';
import { fetchDashboardKPIs, fetchChartsData } from '../../lib/incidentsService';
import { useAuth } from '../../lib/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const [kpiData, setKpiData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'today' | '7d' | 'month' | 'year'>('7d');
  const isFetching = useRef(false);

  useEffect(() => {
    // 🛡️ Prevenir peticiones si no hay usuario o ya estamos cargando
    if (!user?.id) {
      console.log('[Dashboard] Esperando identificación de usuario...');
      setLoading(false); // No bloqueamos si no hay ID
      return;
    }

    if (isFetching.current) return;

    let isMounted = true;
    const loadData = async () => {
      console.log(`[Dashboard] Iniciando sincronización (${periodo})...`);
      try {
        isFetching.current = true;
        setLoading(true);

        const hoy = new Date();
        const desde = new Date();

        if (periodo === 'today') desde.setHours(0, 0, 0, 0);
        else if (periodo === '7d') desde.setDate(hoy.getDate() - 7);
        else if (periodo === 'month') { desde.setDate(1); desde.setHours(0, 0, 0, 0); }
        else if (periodo === 'year') { desde.setMonth(0, 1); desde.setHours(0, 0, 0, 0); }

        const filters = {
          desde: desde.toISOString().split('T')[0],
          hasta: hoy.toISOString().split('T')[0],
        };

        const [kpis, charts] = await Promise.all([
          fetchDashboardKPIs(filters),
          fetchChartsData(filters)
        ]);

        if (isMounted) {
          console.log('[Dashboard] Datos sincronizados con éxito.');
          setKpiData(kpis);
          setChartData(charts);
        }
      } catch (error) {
        console.error("[Dashboard] Error crítico en sincronización:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
          isFetching.current = false;
        }
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
      isFetching.current = false;
    };
  }, [periodo, user?.id]);

  if (loading && !kpiData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <RefreshCcw className="w-12 h-12 text-red-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Sincronizando con MeatMetrics...</p>
      </div>
    );
  }

  const kpis = [
    { label: 'Minutos Perdidos', value: String(kpiData?.totalMinutosPerdidos ?? 0), unit: 'min', icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Pollos No Colgados', value: String(kpiData?.totalPollosNoColgados ?? 0), unit: 'u.', icon: Bird, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Rendimiento Promedio', value: String(kpiData?.rendimientoPromedio ?? '—'), unit: '%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Incidencias Activas', value: String(kpiData?.incidenciasActivas ?? 0), unit: '', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Incidencias', value: String(kpiData?.totalIncidencias ?? 0), unit: '', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Ejecutivo</h2>
          <p className="text-slate-500 mt-1">Resumen de operaciones en tiempo real.</p>
        </div>
        <select
          value={periodo}
          onChange={e => setPeriodo(e.target.value as any)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 shadow-sm focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
        >
          <option value="today">Hoy</option>
          <option value="7d">Últimos 7 días</option>
          <option value="month">Este mes</option>
          <option value="year">Todo el año</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {kpiData?.topIncident && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-2xl shadow-lg border border-red-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-5">
            <AlertTriangle className="w-8 h-8" />
            <div>
              <p className="text-red-100 text-sm font-medium uppercase tracking-wider">Avería más frecuente</p>
              <h3 className="text-xl font-bold mt-0.5">{kpiData.topIncident.name}</h3>
            </div>
          </div>
          <div className="text-right flex gap-8">
            <div>
              <p className="text-red-100 text-xs uppercase font-medium">Repeticiones</p>
              <p className="text-2xl font-black">{kpiData.topIncident.count}</p>
            </div>
            <div className="border-l border-white/20 pl-8">
              <p className="text-red-100 text-xs uppercase font-medium">Impacto Medio</p>
              <p className="text-2xl font-black">{kpiData.topIncident.avgMinutes} min</p>
            </div>
          </div>
        </div>
      )}

      <ChartsArea
        subSectionData={chartData?.subSectionStats || []}
        timeSeriesData={chartData?.timeSeries || []}
        loading={loading}
      />
    </div>
  );
}