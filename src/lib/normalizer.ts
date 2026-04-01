import { MeatMetricsLog } from './types';

// Helper to parse HH:MM:SS to total minutes
function parseTimeStrToMinutes(timeStr: any): number {
  if (typeof timeStr === 'number') {
    // Some excel dates represent fraction of a day for time
    // e.g. 0.041666667 -> 60 minutes
    const totalMinutes = Math.round(timeStr * 24 * 60);
    return totalMinutes;
  }
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return (hours * 60) + minutes;
  }
  return 0;
}

// Helper: Add days to date string YYYY-MM-DD
function addDaysToDate(dateStr: string, days: number): string {
  if (!dateStr) return '';
  let y: number, m: number, d: number;
  const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      d = parseInt(parts[2], 10);
    } else {
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      y = parseInt(parts[2], 10);
    }
    const dateObj = new Date(y, m - 1, d);
    if (isNaN(dateObj.getTime())) return dateStr;
    dateObj.setDate(dateObj.getDate() + days);
    const outY = dateObj.getFullYear();
    const outM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const outD = String(dateObj.getDate()).padStart(2, '0');
    return `${outY}-${outM}-${outD}`;
  }
  return dateStr;
}

export function normalizeData(rawData: any[][], filename: string): MeatMetricsLog[] {
  const result: MeatMetricsLog[] = [];
  
  if (!rawData || rawData.length === 0) return result;

  // Let's analyze the first few rows to determine the type
  let fileType: 'A' | 'B' | 'C' | 'UNKNOWN' = 'UNKNOWN';
  let headerRowIndex = -1;
  let baseDateStr = '';

  for (let i = 0; i < Math.min(20, rawData.length); i++) {
    const row = rawData[i];
    if (!row) continue;
    
    // TIPO A: Informe semanal de averías
    if (row.some(cell => cell && String(cell).toUpperCase().includes('FECHA DEL LUNES'))) {
      const foundCell = row.find(c => c && String(c).toUpperCase().includes('FECHA'));
      const match = foundCell ? String(foundCell).match(/(\d{2})[-/](\d{2})[-/](\d{4})/) : null;
      if (match) {
        baseDateStr = `${match[1]}-${match[2]}-${match[3]}`;
      }
    }
    
    if (row.some(cell => cell && String(cell).toLowerCase().trim() === 'total horas paro')) {
      fileType = 'A';
      headerRowIndex = i;
      break;
    }
    
    // TIPO B: Control de producción diario con columna COMENTARIOS
    if (row.some(cell => cell && String(cell).toLowerCase().includes('comentarios'))) {
      fileType = 'B';
      headerRowIndex = i;
      break;
    }

    // TIPO C: Tabla Markdown embebida en una sola celda (data-model profesional)
    // Se identifica por una celda que empiece con '| Fecha' o '| :---'
    if (row.some(cell => {
      const s = String(cell || '');
      return s.startsWith('|') && (s.toLowerCase().includes('fecha') || s.includes(':---'));
    })) {
      fileType = 'C';
      headerRowIndex = i;
      break;
    }
  }

  if (fileType === 'UNKNOWN' || headerRowIndex === -1) {
    console.warn(`[Normalizer] No se pudo identificar el tipo de archivo o las cabeceras para: ${filename}`);
    return result;
  }

  const headers = rawData[headerRowIndex].map(h => (h ? String(h).toLowerCase().trim() : ''));

  if (fileType === 'A') {
    // Detección blanda
    const idxDia = headers.findIndex(h => h.includes('dia') || h.includes('día'));
    const idxSubseccion = headers.findIndex(h => h.includes('sub-seccion') || h.includes('seccion'));
    const idxAveria = headers.findIndex(h => h.includes('averia') || h.includes('tipo'));
    const idxTurno = headers.findIndex(h => h.includes('turno'));
    const idxHoras = headers.findIndex(h => h.includes('horas paro') || h.includes('total horas') || h.includes('paro'));

    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i];
      // Skip de filas totalmente nulas
      if (!row || row.length === 0 || row.every(c => c === null || c === undefined || c === '')) continue;
      
      // Si falta una celda obvia como la sección, la saltamos sin error si es que no tiene datos
      if (!row[idxSubseccion] && row.every(c => !c)) continue;

      try {
        const dOffset = parseInt(row[idxDia]?.toString(), 10) || 1;
        const fecha = baseDateStr ? addDaysToDate(baseDateStr, dOffset - 1) : new Date().toISOString().split('T')[0];
        
        let turnoRaw = row[idxTurno]?.toString().toUpperCase() || 'TM';
        if (!['TM','TT','TN'].includes(turnoRaw)) turnoRaw = 'TM'; // Fallback
        
        const mParo = parseTimeStrToMinutes(row[idxHoras]);
        
        if (mParo > 0) {
          result.push({
            fecha,
            turno: turnoRaw as 'TM'|'TT'|'TN',
            seccion: row[idxSubseccion]?.toString() || 'General',
            minutosParo: mParo,
            causaAveria: row[idxAveria]?.toString() || 'Sin descripción',
            origenArchivo: filename
          });
        }
      } catch (e) {
        console.error(`[Error Normalizer TIPO A] Fila ${i}:`, row, 'Error exacto:', e);
      }
    }
  } else if (fileType === 'B') {
    // Extract date from filename: e.g. "30-03..." and "...2026..."
    let extractDate = new Date().toISOString().split('T')[0];
    const fnStr = String(filename || '');
    const matchDDMM = fnStr.match(/(\d{2})[-/](\d{2})/);
    const matchYYYY = fnStr.match(/(\d{4})/);
    
    if (matchDDMM) {
      const year = matchYYYY ? matchYYYY[1] : '2026';
      extractDate = `${year}-${matchDDMM[2]}-${matchDDMM[1]}`;
    }

    const idxHorario = headers.findIndex(h => h.includes('horario'));
    const idxAveria = headers.findIndex(h => h.includes('comentarios'));

    if (idxAveria === -1) {
      throw new Error(`[Columna Faltante] No se encontró ninguna columna que contenga "COMENTARIOS" en el archivo Tipo B: ${filename}`);
    }

    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0 || row.every(c => c === null || c === undefined || c === '')) continue;
      
      try {
        const comentarios: string = row[idxAveria]?.toString() || '';
        if (!comentarios.trim()) continue;

        // Regex robusto: cubre "10 min", "10 mins", "10 minutos", "10 mn", "10 m."
        // Nota: \bmin\b evita que coincida con "mínimo"
        let mParo = 0;
        const minMatch =
          String(comentarios).match(/(\d+)\s*minutos?/i) ||
          String(comentarios).match(/(\d+)\s*mins\b/i) ||
          String(comentarios).match(/(\d+)\s*\bmin\b/i) ||
          String(comentarios).match(/(\d+)\s*mn\b/i);
        if (minMatch) {
          mParo = parseInt(minMatch[1], 10);
        }

        // Si no hay minutos detectados: registramos la incidencia con 0 min
        // y emitimos un warning para facilitar la revisión manual.
        // No descartamos NINGUNA fila con texto en la columna COMENTARIOS.
        if (mParo === 0) {
          console.warn(`[Normalizer TIPO B] Fila ${i} sin minutos detectables → registrando con 0 min: "${comentarios}"`);
        }

        let turnoRaw: 'TM'|'TT'|'TN' = 'TM';
        const horarioStr = row[idxHorario]?.toString() || '';
        const matchTime = String(horarioStr).match(/(\d+)/);
        if (matchTime) {
          const startHour = parseInt(matchTime[1], 10);
          if (startHour >= 6 && startHour < 14) turnoRaw = 'TM';
          else if (startHour >= 14 && startHour < 22) turnoRaw = 'TT';
          else turnoRaw = 'TN';
        }

        result.push({
          fecha: extractDate,
          turno: turnoRaw,
          seccion: 'Sala de Despiece',
          minutosParo: mParo,
          causaAveria: comentarios,
          origenArchivo: filename
        });
      } catch (e) {
        console.error(`[Error Normalizer TIPO B] Fila ${i}:`, row, 'Error exacto:', e);
      }
    }

  } else if (fileType === 'C') {
    // TIPO C: Datos embebidos en celdas como tabla Markdown
    // Formato: | Fecha | Semana | Turno | Sección | Sub-sección | Tipo | Descripción | Inicio | Fin | Total Minutos | ... |
    console.log(`[Normalizer] Archivo TIPO C (Tabla Markdown) detectado: ${filename}`);

    // Buscar encabezado real (la fila que contenga 'fecha' en el string de la celda pero NO ':---')
    let mdHeaders: string[] = [];
    let mdHeaderRowIdx = -1;
    for (let i = headerRowIndex; i < Math.min(headerRowIndex + 5, rawData.length); i++) {
      const row = rawData[i];
      if (!row) continue;
      const cellStr = String(row[0] || '');
      if (cellStr.startsWith('|') && cellStr.toLowerCase().includes('fecha') && !cellStr.includes(':---')) {
        mdHeaders = cellStr.split('|').map(h => h.trim().toLowerCase()).filter(h => h.length > 0);
        mdHeaderRowIdx = i;
        break;
      }
    }

    if (mdHeaderRowIdx === -1 || mdHeaders.length === 0) {
      console.warn(`[Normalizer TIPO C] No se pudieron extraer las cabeceras Markdown de: ${filename}`);
      return result;
    }

    // Map column names to indices within the split cells
    const mdIdxFecha    = mdHeaders.findIndex(h => h.includes('fecha'));
    const mdIdxTurno    = mdHeaders.findIndex(h => h.includes('turno'));
    const mdIdxSeccion  = mdHeaders.findIndex(h => h.includes('secci') || h.includes('seccion'));
    const mdIdxSubsec   = mdHeaders.findIndex(h => h.includes('sub-secci') || h.includes('sub secci'));
    const mdIdxDesc     = mdHeaders.findIndex(h => h.includes('descripci') || h.includes('averia') || h.includes('averí'));
    const mdIdxMinutos  = mdHeaders.findIndex(h => h.includes('minuto') || h.includes('total min'));

    for (let i = mdHeaderRowIdx + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row) continue;
      const cellStr = String(row[0] || '').trim();
      // Saltar separadores y filas vacías
      if (!cellStr || cellStr === '---' || cellStr.includes(':---') || !cellStr.startsWith('|')) continue;

      try {
        const cols = cellStr.split('|').map(c => c.trim()).filter((_, idx) => idx > 0); // quitar primer elemento vacío

        // Normalizar fecha DD/MM/YYYY → YYYY-MM-DD
        let fecha = new Date().toISOString().split('T')[0];
        const fechaRaw = cols[mdIdxFecha] || '';
        const fechaMatch = fechaRaw.match(/(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/);
        if (fechaMatch) {
          fecha = `${fechaMatch[3]}-${fechaMatch[2].padStart(2,'0')}-${fechaMatch[1].padStart(2,'0')}`;
        }

        let turno: 'TM'|'TT'|'TN' = 'TM';
        const turnoRaw = (cols[mdIdxTurno] || '').toUpperCase().trim();
        if (['TM','TT','TN'].includes(turnoRaw)) turno = turnoRaw as 'TM'|'TT'|'TN';

        const seccion = cols[mdIdxSubsec] || cols[mdIdxSeccion] || 'General';
        const causaAveria = cols[mdIdxDesc] || 'Sin descripción';

        // Minutos: puede ser número directo o HH:MM
        let minutosParo = 0;
        const minRaw = cols[mdIdxMinutos] || '';
        if (minRaw && !isNaN(Number(minRaw))) {
          minutosParo = parseInt(minRaw, 10);
        } else {
          minutosParo = parseTimeStrToMinutes(minRaw);
        }

        // Solo registrar si hay minutos de paro o descripción significativa
        if (minutosParo > 0 || causaAveria.length > 3) {
          result.push({
            fecha,
            turno,
            seccion,
            minutosParo,
            causaAveria,
            origenArchivo: filename
          });
        }
      } catch (e) {
        console.error(`[Error Normalizer TIPO C] Fila ${i}:`, row[0], 'Error exacto:', e);
      }
    }
  }

  return result;
}
