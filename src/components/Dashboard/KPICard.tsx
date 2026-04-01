import React from 'react';
import { cn } from '@/src/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface KPIData {
  label: string;
  value: string | number;
  unit: string;
  change?: string;
  trend?: 'up' | 'down';
  icon: LucideIcon;
  color: string;
  bg: string;
}

export const KPICard: React.FC<{ kpi: KPIData }> = ({ kpi }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-xl transition-colors", kpi.bg)}>
          <kpi.icon className={cn("w-6 h-6", kpi.color)} />
        </div>
        {kpi.change !== undefined && (
          <span className={cn(
            "text-xs font-bold px-2 py-1 rounded-lg",
            kpi.trend === 'up' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {kpi.change}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <h4 className="text-2xl font-bold text-slate-900">{kpi.value}</h4>
          <span className="text-sm font-medium text-slate-400">{kpi.unit}</span>
        </div>
      </div>
    </div>
  );
};
