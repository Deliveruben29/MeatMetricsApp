import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface DropzoneAreaProps {
  onFilesAccepted: (files: File[]) => void;
}

export function DropzoneArea({ onFilesAccepted }: DropzoneAreaProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFilesAccepted(acceptedFiles);
    }
  }, [onFilesAccepted]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dropzoneOptions: any = {
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls', '.csv'],
      'text/csv': ['.csv'],
    },
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  return (
    <div
      {...getRootProps()}
      className={`bg-white p-12 rounded-2xl shadow-sm border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
        isDragActive ? 'border-blue-400 bg-blue-50 opacity-90' : 'border-slate-200 hover:border-red-400'
      }`}
    >
      <input {...getInputProps()} />
      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-transform ${
        isDragActive ? 'bg-blue-100 scale-110' : 'bg-red-50 group-hover:scale-110'
      }`}>
        <Upload className={`w-10 h-10 ${isDragActive ? 'text-blue-600' : 'text-red-600'}`} />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        {isDragActive ? 'Suelta los archivos aquí...' : 'Arrastra y suelta tus archivos aquí'}
      </h3>
      <p className="text-slate-500 mb-8 max-w-sm">
        Soporta archivos .csv, .xls y .xlsx exportados desde el sistema de planta.
      </p>
      <button className={`text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all ${
        isDragActive ? 'bg-blue-600 shadow-blue-200' : 'bg-red-600 shadow-red-200 hover:bg-red-700'
      }`}>
        Seleccionar Archivos
      </button>
    </div>
  );
}
