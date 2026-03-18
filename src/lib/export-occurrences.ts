import * as XLSX from 'xlsx';
import type { Occurrence } from '@/types/occurrence';

export function exportOccurrences(data: Occurrence[]) {
  const rows = data.map((item) => ({
    'Nº de Ocorrência': item.numero_ocorrencia,
    Unidade: item.units?.nome || '',
    'Local da Ocorrência': item.local_ocorrencia,
    Ocorrência: item.ocorrencia,
    'Estado Ocorrência': item.estado,
    'Data de Reporte': item.data_reporte,
    'Data de resolução/Resposta': item.data_resolucao_resposta,
    'Outras Informações': item.outras_informacoes,
    'Flag de revisão': item.flag_revisao,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Ocorrencias');
  XLSX.writeFile(wb, 'Ocorrencias_DEM_exportado.xlsx');
}
