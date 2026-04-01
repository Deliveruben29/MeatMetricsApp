import React from 'react';
import { FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export type UploadStatus = 'processing' | 'success' | 'error';

export interface UploadRecord {
  id: string;
  filename: string;
  status: UploadStatus;
  message?: string;
  parsedCount?: number;
  totalMinutes?: number;
}

interface UploadHistoryProps {
  uploads: UploadRecord[];
}

export function UploadHistory({ uploads }: UploadHistoryProps) {
  if (uploads.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Historial de Carga</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {uploads.map((upload) => (
          <div key={upload.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              upload.status === 'success' ? 'bg-green-50' :
              upload.status === 'error' ? 'bg-red-50' : 'bg-blue-50'
            }`}>
              {upload.status === 'success' && <CheckCircle2 className="w-6 h-6 text-green-600" />}
              {upload.status === 'error' && <AlertCircle className="w-6 h-6 text-red-600" />}
              {upload.status === 'processing' && <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                {upload.status === 'success' 
                  ? `${upload.parsedCount} registros - ${upload.totalMinutes} min totales` 
                  : upload.status === 'error' ? 'Error' : 'Procesando'}
              </p>
              <p className="text-sm font-semibold text-slate-800 truncate" title={upload.filename}>
                {upload.filename}
              </p>
              {upload.message && (
                <p className="text-xs text-red-500 mt-1 truncate" title={upload.message}>
                  {upload.message}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
