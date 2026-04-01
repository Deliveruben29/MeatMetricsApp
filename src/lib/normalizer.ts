import * as XLSX from 'xlsx';
import { MeatMetricsLog } from './types';

export async function parseExcelFile(file: File): Promise<MeatMetricsLog[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // raw: false para ver el "texto" de la celda y no la fórmula bruta
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];

        const filename = file.name;
        const normalized = normalizeData(jsonData, filename);
        resolve(normalized);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function normalizeData(rawData: any[][], filename: string): MeatMetricsLog[] {
  const result: MeatMetricsLog[] = [];
  const normalizedName = filename.toUpperCase();
  const is4800 = normalizedName.includes('4800');

  // 1. Detector de cabeceras
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(rawData.length, 20); i++) {
    const rowStr = JSON.stringify(rawData[i]).toLowerCase();
    if (rowStr.includes('hora') && (rowStr.includes('pieza') || rowStr.includes('produc') || rowStr.includes('inciden'))) {
      headerRowIndex = i;
      break;
    }
  }
  if (headerRowIndex === -1) headerRowIndex = rawData.findIndex(row => row && row.filter(c => c !== null && c !== '').length > 10);
  if (headerRowIndex === -1) return [];

  const headers = (rawData[headerRowIndex] || []).map(h => String(h || '').toLowerCase());
  const dataRows = rawData.slice(headerRowIndex + 1);

  const dateMatch = filename.match(/(\d{2})[-_](\d{2})[-_](\d{4})/);
  const fecha = dateMatch ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : new Date().toISOString().split('T')[0];

  let shiftFromFilename: MeatMetricsLog['turno'] = is4800 ? 'TM' : 'TT';

  dataRows.forEach((row) => {
    if (!row || row.length < 5 || row.every(c => !c)) return;

    try {
      const idxMin = headers.findIndex(h => h.includes('minut') || h.includes('paro')) === -1 ? 8 : headers.findIndex(h => h.includes('minut') || h.includes('paro'));
      const idxAve = headers.findIndex(h => h.includes('menta') || h.includes('averia') || h.includes('inciden')) === -1 ? 7 : headers.findIndex(h => h.includes('menta') || h.includes('averia') || h.includes('inciden'));
      const idxSub = headers.findIndex(h => h.includes('modulo') || h.includes('seccion')) === -1 ? 13 : headers.findIndex(h => h.includes('modulo') || h.includes('seccion'));
      const idxPoll = 20; // Columna U

      const causaAveria = String(row[idxAve] || '').trim();

      // --- TRUCO 1: Extraer minutos de la columna O del TEXTO ---
      let mParo = 0;
      const sMinCol = String(row[idxMin] || '0').replace(/[^0-9]/g, '');
      mParo = parseInt(sMinCol, 10) || 0;

      // Si la columna está a 0, buscamos en el comentario (ej: "45 minutos parados")
      if (mParo === 0) {
        const matchMin = causaAveria.match(/(\d+)\s*(minutos|min)/i);
        if (matchMin) mParo = parseInt(matchMin[1], 10);
      }

      // --- TRUCO 2: Limpiar pollos con decimales (Evitar los trillones) ---
      let pollos = 0;
      const rawPollos = String(row[idxPoll] || '0').replace(',', '.'); // Cambiar coma por punto
      const numPollos = parseFloat(rawPollos);
      if (!isNaN(numPollos)) {
        pollos = Math.round(numPollos); // Redondear 40.33 a 40
      }

      if (mParo > 0 || (causaAveria.length > 2 && !causaAveria.toLowerCase().includes('ejemplo')) || pollos > 0) {
        result.push({
          fecha,
          turno: shiftFromFilename,
          seccion: String(row[idxSub] || 'Sala de Despiece'),
          minutosParo: mParo,
          causaAveria: causaAveria || (pollos > 0 ? 'Pérdida rendimiento' : 'Sin descripción'),
          pollosNoColgados: pollos,
          origenArchivo: filename
        });
      }
    } catch (e) {
      console.warn('[Normalizer] Error:', e);
    }
  });

  return result;
}