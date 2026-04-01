import { supabase } from './supabaseClient';
import { ReportRow } from './types';

// ─── Tipos que mapean directamente a la tabla incidents en Supabase ───
export interface IncidentRecord {
  id?: string;
  fecha: string;
  turno: 'TM' | 'TT' | 'TN';
  seccion: string;
  subseccion?: string;
  tipo_incidencia: string;
  descripcion_averia?: string;
  inicio_paro?: string | null;
  fin_paro?: string | null;
  total_minutos: number;
  rendimiento_pct?: number | null;
  pollos_no_colgados: number;
  estatus: string;
  origen_archivo?: string;
  created_at?: string;
}

// ─── Mapear ReportRow → IncidentRecord para inserción ────────────────
function reportRowToRecord(row: ReportRow): IncidentRecord {
  return {
    fecha: row.fecha,
    turno: row.turno,
    seccion: row.seccion,
    subseccion: row.subseccion || row.seccion,
    tipo_incidencia: row.tipoIncidencia,
    descripcion_averia: row.descripcionAveria,
    inicio_paro: row.inicioParo || null,
    fin_paro: row.finParo || null,
    total_minutos: row.totalMinutos,
    rendimiento_pct: row.rendimientoPct,
    pollos_no_colgados: row.pollosNoColgados || 0,
    estatus: row.estatus,
    origen_archivo: row.origenArchivo,
  };
}

// ─── Guardar lote de incidencias desde el ReportGenerator ────────────
export async function saveIncidents(rows: ReportRow[]): Promise<{ count: number; error: string | null }> {
  // Obtener el usuario actual para el campo created_by
  const { data: { user } } = await supabase.auth.getUser();
  
  const records = rows.map(row => ({
    ...reportRowToRecord(row),
    created_by: user?.id
  }));

  const { data, error } = await supabase
    .from('incidents')
    .insert(records)
    .select('id');

  if (error) {
    console.error('[incidentsService] Error al guardar:', error.message);
    return { count: 0, error: error.message };
  }

  return { count: data?.length ?? 0, error: null };
}

// ─── Obtener incidencias con filtros opcionales ───────────────────────
export interface FetchFilters {
  desde?: string;  // YYYY-MM-DD
  hasta?: string;  // YYYY-MM-DD
  turno?: 'TM' | 'TT' | 'TN';
  estatus?: string;
}

export async function fetchIncidents(filters: FetchFilters = {}): Promise<{ data: IncidentRecord[]; error: string | null }> {
  let query = supabase
    .from('incidents')
    .select('*')
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters.desde) query = query.gte('fecha', filters.desde);
  if (filters.hasta) query = query.lte('fecha', filters.hasta);
  if (filters.turno) query = query.eq('turno', filters.turno);
  if (filters.estatus) query = query.eq('estatus', filters.estatus);

  const { data, error } = await query;

  if (error) {
    console.error('[incidentsService] Error al leer:', error.message);
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as IncidentRecord[], error: null };
}

// ─── KPIs para el Dashboard ──────────────────────────────────────────
export interface DashboardKPIs {
  totalMinutosPerdidos: number;
  rendimientoPromedio: number | null;
  incidenciasActivas: number;
  totalIncidencias: number;
  totalPollosNoColgados: number;
  topIncident?: {
    name: string;
    count: number;
    avgMinutes: number;
  } | null;
}

export async function fetchDashboardKPIs(filters: FetchFilters = {}): Promise<DashboardKPIs> {
  const { data, error } = await fetchIncidents(filters);

  if (error || !data.length) {
    return { 
      totalMinutosPerdidos: 0, 
      rendimientoPromedio: null, 
      incidenciasActivas: 0, 
      totalIncidencias: 0, 
      totalPollosNoColgados: 0,
      topIncident: null 
    };
  }

  const totalMinutos = data.reduce((s, r) => s + (r.total_minutos ?? 0), 0);
  const totalPollos = data.reduce((s, r) => s + (r.pollos_no_colgados ?? 0), 0);
  const withRend = data.filter(r => r.rendimiento_pct !== null && r.rendimiento_pct !== undefined);
  const avgRend = withRend.length > 0
    ? withRend.reduce((s, r) => s + (r.rendimiento_pct ?? 0), 0) / withRend.length
    : null;
  const activas = data.filter(r => r.estatus !== '✅ Resuelto').length;

  // ─── Análisis de Avería más repetida (Top Incident) ───────────────────
  // Normalizador para agrupar (Ignora mayúsculas, signos comunes, etc)
  const normalize = (t: string) => t.toLowerCase().trim().replace(/[.,]/g, '');

  const frequencyMap: Record<string, { count: number, totalMins: number, validTimeCount: number }> = {};
  data.forEach(inc => {
    const rawDesc = inc.descripcion_averia || '--';
    if (rawDesc === '--' || rawDesc.length < 3) return;
    
    // Usamos el nombre normalizado para agrupar, pero guardamos el original para mostrar
    const normKey = normalize(rawDesc);
    if (!frequencyMap[normKey]) {
      frequencyMap[normKey] = { count: 0, totalMins: 0, validTimeCount: 0 };
    }
    
    frequencyMap[normKey].count++;
    const m = (inc.total_minutos || 0);
    if (m > 0) {
      frequencyMap[normKey].totalMins += m;
      frequencyMap[normKey].validTimeCount++;
    }
  });

  let topInc: DashboardKPIs['topIncident'] = null;
  const entries = Object.entries(frequencyMap);
  if (entries.length > 0) {
    // Filtramos ruido: Si tiene 0 mins y es una frase sospechosa de plantilla, la ignoramos para el BANNER
    const blacklist = ['falta personal', 'sin descripcion', 'ejemplo', 'notas', 'perdida por rendimiento'];
    const filteredEntries = entries.filter(([normKey, stats]) => {
      // Si es una pérdida por rendimiento (crónica), no la mostramos como "Avería"
      if (normKey.includes('perdida por rendimiento')) return false;
      if (stats.totalMins > 0) return true;
      return !blacklist.some(b => normKey.includes(b));
    });

    const targetEntries = filteredEntries.length > 0 ? filteredEntries : entries;

    // Ordenamos por: 1. Frecuencia descendente, 2. Impacto minutos descendente
    const sorted = targetEntries.sort((a, b) => {
      const diffCount = b[1].count - a[1].count;
      if (diffCount !== 0) return diffCount;
      return b[1].totalMins - a[1].totalMins;
    });

    const [normKey, stats] = sorted[0];
    const originalName = data.find(d => normalize(d.descripcion_averia || '') === normKey)?.descripcion_averia || normKey;

    topInc = {
      name: originalName,
      count: stats.count,
      avgMinutes: stats.validTimeCount > 0 
        ? Math.round(stats.totalMins / stats.validTimeCount) 
        : 0
    };
  }

  return {
    totalMinutosPerdidos: totalMinutos,
    rendimientoPromedio: avgRend !== null ? Math.round(avgRend * 10) / 10 : null,
    incidenciasActivas: activas,
    totalIncidencias: data.length,
    totalPollosNoColgados: totalPollos,
    topIncident: topInc
  };
}

// ─── Datos para Gráficas ─────────────────────────────────────────────
export interface ChartDataSets {
  subSectionStats: { name: string; count: number; minutes: number }[];
  timeSeries: { date: string; minutes: number; count: number; pollos: number }[];
}

export async function fetchChartsData(filters: FetchFilters = {}): Promise<ChartDataSets> {
  const { data, error } = await fetchIncidents(filters);
  if (error || !data.length) return { subSectionStats: [], timeSeries: [] };

  // 1. Agrupar por Sub-sección (Top 5)
  const ssMap: Record<string, { count: number; minutes: number }> = {};
  data.forEach(inc => {
    const ss = inc.subseccion || 'Otros';
    if (!ssMap[ss]) ssMap[ss] = { count: 0, minutes: 0 };
    ssMap[ss].count++;
    ssMap[ss].minutes += (inc.total_minutos || 0);
  });

  const subSectionStats = Object.entries(ssMap)
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 5);

  // 2. Agrupar por Fecha (Tendencia)
  const tsMap: Record<string, { minutes: number; count: number; pollos: number }> = {};
  data.forEach(inc => {
    const d = inc.fecha;
    if (!tsMap[d]) tsMap[d] = { minutes: 0, count: 0, pollos: 0 };
    tsMap[d].minutes += (inc.total_minutos || 0);
    tsMap[d].count++;
    tsMap[d].pollos += (inc.pollos_no_colgados || 0);
  });

  const timeSeries = Object.entries(tsMap)
    .map(([date, s]) => ({ date, ...s }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { subSectionStats, timeSeries };
}

// ─── Actualizar estatus o tipo de una incidencia ─────────────────────
export async function updateIncident(id: string, patch: Partial<IncidentRecord>): Promise<{ error: string | null }> {
  const { error } = await supabase.from('incidents').update(patch).eq('id', id);
  return { error: null };
}

// ─── Borrado de incidencias ──────────────────────────────────────────
export async function deleteIncident(id: string) {
  const { error } = await supabase.from('incidents').delete().eq('id', id);
  return { error: error ? error.message : null };
}

export async function clearAllIncidents() {
  const { error } = await supabase.from('incidents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  return { error: error ? (error.message || String(error)) : null };
}
