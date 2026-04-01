export type TipoIncidencia = 'Mecánica' | 'Eléctrica' | 'Pausa' | 'Otros';
export type Estatus = '✅ Resuelto' | '⚠️ Pendiente' | '🔴 Crítico';

export interface MeatMetricsLog {
  id?: string;
  fecha: string; // Formato YYYY-MM-DD
  turno: 'TM' | 'TT' | 'TN';
  seccion: string;
  minutosParo: number;
  causaAveria: string;
  pollosNoColgados: number;
  origenArchivo?: string;
}

// Fila enriquecida dentro del ReportGenerator
export interface ReportRow {
  id: string;
  fecha: string;
  turno: 'TM' | 'TT' | 'TN';
  seccion: string;
  subseccion: string;
  tipoIncidencia: TipoIncidencia;
  descripcionAveria: string;
  inicioParo: string;
  finParo: string;
  totalMinutos: number;
  rendimientoPct: number | null;
  pollosNoColgados: number;
  estatus: Estatus;
  origenArchivo?: string;
}
