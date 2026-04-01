import React, { memo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Line, ComposedChart 
} from 'recharts';

interface ChartsAreaProps {
  subSectionData: { name: string; count: number; minutes: number }[];
  timeSeriesData: { date: string; minutes: number; count: number; pollos: number }[];
  loading?: boolean;
}

export const ChartsArea = memo(({ subSectionData, timeSeriesData, loading }: ChartsAreaProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 opacity-50 animate-pulse">
        <div className="bg-white p-8 rounded-2xl h-[400px] border border-slate-100" />
        <div className="bg-white p-8 rounded-2xl h-[400px] border border-slate-100" />
      </div>
    );
  }

  const hasData = subSectionData.length > 0 || timeSeriesData.length > 0;

  if (!hasData) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
        <p className="text-slate-400 font-medium italic">No hay datos suficientes para generar gráficos en este periodo.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
      {/* Gráfico 1: Top Subsecciones por Minutos Perdidos */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[450px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Impacto por Sub-sección</h3>
            <p className="text-xs text-slate-500">Top 5 secciones con más minutos parados</p>
          </div>
        </div>
        <div className="flex-1 w-full overflow-hidden">
          <ResponsiveContainer width="99%" height="100%">
            <BarChart
              layout="vertical"
              data={subSectionData}
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={80} 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar 
                dataKey="minutes" 
                fill="#dc2626" 
                radius={[0, 4, 4, 0]} 
                barSize={20}
                name="Minutos perdidos"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 2: Evolución Temporal */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[450px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Tendencia de Paros</h3>
            <p className="text-xs text-slate-500">Minutos perdidos y pollos no colgados</p>
          </div>
        </div>
        <div className="flex-1 w-full overflow-hidden">
          <ResponsiveContainer width="99%" height="100%">
            <ComposedChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMins" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(val) => val.split('-').slice(1).join('/')}
                tick={{ fill: '#64748b', fontSize: 10 }}
              />
              <YAxis 
                yAxisId="left"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6366f1', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="minutes" 
                stroke="#dc2626" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorMins)" 
                name="Minutos"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="pollos"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                name="Pollos No Colgados"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});
