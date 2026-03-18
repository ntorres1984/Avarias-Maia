export type UserRole = 'admin' | 'tecnico' | 'utilizador';
export type OccurrenceStatus = 'Em aberto' | 'Em análise' | 'A aguardar resposta' | 'Em execução' | 'Concluída' | 'Sem efeito' | 'Duplicado';
export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export interface Unit {
  id: string;
  nome: string;
}

export interface Occurrence {
  id: string;
  numero_ocorrencia: string | null;
  unidade_id: string;
  local_ocorrencia: string | null;
  ocorrencia: string;
  categoria: string | null;
  prioridade: Priority | null;
  estado: OccurrenceStatus;
  data_reporte: string;
  data_resolucao_resposta: string | null;
  outras_informacoes: string | null;
  flag_revisao: string | null;
  prazo_previsto?: string | null;
  resolvida_fora_sla?: boolean | null;
  created_at: string;
  updated_at: string;
  units?: { nome: string } | null;
}
