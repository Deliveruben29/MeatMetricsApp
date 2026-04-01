import * as xlsx from 'xlsx';
import { normalizeData } from './normalizer';
import { MeatMetricsLog } from './types';

export async function processFile(file: File): Promise<MeatMetricsLog[]> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          if (!e.target?.result) {
            resolve([]);
            return;
          }
          const data = new Uint8Array(e.target.result as ArrayBuffer);
          const workbook = xlsx.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
          
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          
          const rawData: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });
          
          const result = normalizeData(rawData, file.name);
          resolve(result);
        } catch (error) {
          console.error('[MotorAbsorcion] Error parseando datos con xlsx', error);
          reject(error);
        }
      };

      reader.onerror = (error) => {
        console.error('[MotorAbsorcion] Error de lectura del archivo', error);
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
       console.error('[MotorAbsorcion] Error inicializando lectura', error);
       reject(error);
    }
  });
}
