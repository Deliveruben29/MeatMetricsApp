import React from 'react';

export function ChartsArea() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-slate-800">Averías por Sub-sección</h3>
          <button className="text-sm text-red-600 font-semibold hover:underline">Ver detalles</button>
        </div>
        <div className="flex-1 bg-slate-50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-medium italic">Gráfico de Barras (Recharts) próximamente...</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-slate-800">Producción vs Objetivo</h3>
          <button className="text-sm text-red-600 font-semibold hover:underline">Ver reporte</button>
        </div>
        <div className="flex-1 bg-slate-50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-medium italic">Gráfico de Líneas (Recharts) próximamente...</p>
        </div>
      </div>
    </div>
  );
}
