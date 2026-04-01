import React, { useState } from 'react';
import { DropzoneArea } from './DropzoneArea';
import { UploadHistory, UploadRecord } from './UploadHistory';
import { RecordsTable } from './RecordsTable';
import ReportGenerator from '../Report/ReportGenerator';
import { processFile } from '@/src/lib/absorptionEngine';
import { MeatMetricsLog } from '@/src/lib/types';
import { Trash2 } from 'lucide-react';

export default function Import() {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [records, setRecords] = useState<MeatMetricsLog[]>([]);

  const handleClearAll = () => {
    setUploads([]);
    setRecords([]);
  };

  const handleFilesAccepted = async (acceptedFiles: File[]) => {
    // Si se sube el mismo archivo, Date.now() y crypto garantizan un ID único para el historial
    const newUploads = acceptedFiles.map(file => ({
      id: crypto.randomUUID(),
      filename: file.name,
      status: 'processing' as const,
    }));
    
    setUploads(prev => [...newUploads, ...prev]);

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const uploadId = newUploads[i].id;
      
      try {
        const parsedData = await processFile(file);
        
        // Calcular KPI: Minutos totales en el archivo
        const totalMin = parsedData.reduce((acc, curr) => acc + (curr.minutosParo || 0), 0);
        
        console.log(`[Import] Datos extraídos de ${file.name}:`, parsedData);

        setUploads(prev => prev.map(u => 
          u.id === uploadId 
            ? { ...u, status: 'success', parsedCount: parsedData.length, totalMinutes: totalMin } 
            : u
        ));

        setRecords(prev => [...prev, ...parsedData]);

      } catch (error) {
        setUploads(prev => prev.map(u => 
          u.id === uploadId 
            ? { ...u, status: 'error', message: String(error) } 
            : u
        ));
      }
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Importador de Datos</h2>
          <p className="text-slate-500 mt-1">Sube tus archivos CSV o XLSX para automatizar el registro de incidencias y producción.</p>
        </div>
        
        {(uploads.length > 0 || records.length > 0) && (
          <button 
            onClick={handleClearAll}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-5 py-2.5 rounded-xl font-bold hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Limpiar Todo
          </button>
        )}
      </div>

      <DropzoneArea onFilesAccepted={handleFilesAccepted} />

      {uploads.length > 0 && (
        <UploadHistory uploads={uploads} />
      )}

      {records.length > 0 && (
        <>
          <RecordsTable records={records} />
          <div className="mt-8">
            <ReportGenerator records={records} />
          </div>
        </>
      )}
    </div>
  );
}
