import { z } from 'zod';

export const occurrenceSchema = z.object({
  numero_ocorrencia: z.string().optional(),
  unidade_id: z.string().uuid('Seleciona uma unidade válida'),
  local_ocorrencia: z.string().min(1, 'Indica o local da ocorrência'),
  ocorrencia: z.string().min(3, 'Descreve a ocorrência'),
  categoria: z.string().optional(),
  prioridade: z.enum(['Baixa', 'Média', 'Alta', 'Crítica']),
  estado: z.enum(['Em aberto', 'Em análise', 'A aguardar resposta', 'Em execução', 'Concluída', 'Sem efeito', 'Duplicado']),
  data_reporte: z.string().min(1, 'Indica a data de reporte'),
  data_resolucao_resposta: z.string().optional().nullable(),
  outras_informacoes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.estado === 'Concluída' && !data.data_resolucao_resposta) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['data_resolucao_resposta'], message: 'Ocorrências concluídas precisam de data de resolução/resposta' });
  }
  if (data.data_resolucao_resposta && data.data_resolucao_resposta < data.data_reporte) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['data_resolucao_resposta'], message: 'A data de resolução não pode ser anterior ao reporte' });
  }
});

export type OccurrenceFormValues = z.infer<typeof occurrenceSchema>;
