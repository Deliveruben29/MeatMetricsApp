import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { KPICard, KPIData } from './KPICard';
import { ChartsArea } from './ChartsArea';

const kpis: KPIData[] = [
  { label: 'Minutos Perdidos', value: '142', unit: 'min', change: '+12%', trend: 'up', icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
  { label: 'Rendimiento Promedio', value: '94.2', unit: '%', change: '+2.4%', trend: 'up', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Incidencias Activas', value: '3', unit: '', change: '-1', trend: 'down', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Producción Total', value: '42.8', unit: 'k', change: '+5%', trend: 'up', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Ejecutivo</h2>
          <p className="text-slate-500 mt-1">Resumen de operaciones y rendimiento en tiempo real.</p>
        </div>
        <div className="flex gap-3">
          <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-red-500/20 outline-none">
            <option>Hoy</option>
            <option>Últimos 7 días</option>
            <option>Este mes</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <ChartsArea />
    </div>
  );
}
