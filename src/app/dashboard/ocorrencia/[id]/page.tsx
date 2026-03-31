'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ESTADOS } from '@/lib/constants'

type UnitRelation =
  | {
      nome: string | null
    }
  | {
      nome: string | null
    }[]
  | null

type Occurrence = {
  id: string
  ocorrencia: string | null
  local_ocorrencia: string | null
  categoria: string | null
  prioridade: string | null
  impacto: string | null
  estado: string | null
  data_reporte: string | null
  data_estado: string | null
  data_encerramento: string | null
  observacoes: string | null
  sla_dias: number | null
  fora_sla: boolean | null
  created_by: string | null
  units: UnitRelation
}

type HistoryItem = {
  id: number
  occurrence_id: string
  estado_anterior: string | null
  estado_novo: string
  observacoes: string | null
  user_email: string | null
  data_alteracao: string
}

type ProfileData = {
  perfil: string | null
}

function getUnitName(units: UnitRelation, fallback: string | null) {
  if (Array.isArray(units)) {
    return units[0]?.nome || fallback || '-'
  }
  return units?.nome || fallback || '-'
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-PT')
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('pt-PT')
}

function toInputDate(dateString: string | null) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function toInputDateTime(dateString: string | null) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function fromInputDateTime(value: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function isForaSLA(item: {
  data_reporte: string | null
  data_encerramento: string | null
  sla_dias: number | null
  estado: string | null
}) {
  if (!item.data_reporte || item.sla_dias == null) return false

  const inicio = new Date(item.data_reporte).getTime()
  if (Number.isNaN(inicio)) return false

  const referencia =
    item.estado === 'Concluída' || item.estado === 'Encerrada'
      ? item.data_encerramento
        ? new Date(item.data_encerramento).getTime()
        : Date.now()
      : Date.now()

  if (Number.isNaN(referencia)) return false

  const diasPassados = (referencia - inicio) / (1000 * 60 * 60 * 24)
  return diasPassados > item.sla_dias
}

function getEstadoBadgeStyle(estado: string | null) {
  if (estado === 'Concluída') {
    return {
      backgroundColor: '#dcfce7',
      color: '#166534',
    }
  }

  if (estado === 'Encerrada') {
    return {
      backgroundColor: '#e2e8f0',
      color: '#334155',
    }
  }

  if (estado === 'Em execução') {
    return {
      backgroundColor: '#dbeafe',
      color: '#1d4ed8',
    }
  }

  if (estado === 'Em análise') {
    return {
      backgroundColor: '#fef3c7',
      color: '#92400e',
    }
  }

  return {
    backgroundColor: '#ede9fe',
    color: '#6d28d9',
  }
}

function getPrioridadeBadgeStyle(prioridade: string | null) {
  if (prioridade === 'Alta') {
    return {
      backgroundColor: '#fee2e2',
      color: '#b91c1c',
    }
  }

  if (prioridade === 'Média') {
    return {
      backgroundColor: '#fef3c7',
      color: '#92400e',
    }
  }

  if (prioridade === 'Baixa') {
    return {
      backgroundColor: '#dcfce7',
      color: '#166534',
    }
  }

  return {
    backgroundColor: '#f1f5f9',
    color: '#475569',
  }
}

function getImpactoBadgeStyle(impacto: string | null) {
  if (impacto === 'Crítico') {
    return {
      backgroundColor: '#fee2e2',
      color: '#b91c1c',
    }
  }

  if (impacto === 'Alto') {
    return {
      backgroundColor: '#ffedd5',
      color: '#c2410c',
    }
  }

  if (impacto === 'Médio') {
    return {
      backgroundColor: '#fef3c7',
      color: '#a16207',
    }
  }

  if (impacto === 'Baixo') {
    return {
      backgroundColor: '#dcfce7',
      color: '#166534',
    }
  }

  return {
    backgroundColor: '#f1f5f9',
    color: '#475569',
  }
}

const styles = {
  page: {
    padding: '24px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
    color: '#0f172a',
  } as const,

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap' as const,
    marginBottom: '24px',
  } as const,

  title: {
    margin: 0,
    fontSize: '38px',
    fontWeight: 700,
  } as const,

  subtitle: {
    marginTop: '8px',
    fontSize: '14px',
    color: '#475569',
    fontWeight: 600,
  } as const,

  backLink: {
    color: '#475569',
    textDecoration: 'none',
    fontWeight: 600,
  } as const,

  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
    marginBottom: '20px',
  } as const,

  topSummaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  } as const,

  summaryCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '18px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  } as const,

  summaryLabel: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: 600,
    marginBottom: '10px',
  } as const,

  summaryValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0f172a',
    lineHeight: 1.3,
  } as const,

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  } as const,

  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },

  fieldFull: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    gridColumn: '1 / -1',
  } as const,

  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#334155',
  } as const,

  input: {
    minHeight: '42px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '10px 12px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  } as const,

  textarea: {
    minHeight: '130px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '10px 12px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    resize: 'vertical' as const,
    outline: 'none',
  } as const,

  readOnly: {
    backgroundColor: '#f8fafc',
  } as const,

  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginTop: '20px',
  } as const,

  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #0f172a',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
    minHeight: '44px',
  } as const,

  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    textDecoration: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
    minHeight: '44px',
  } as const,

  messageSuccess: {
    color: '#166534',
    backgroundColor: '#dcfce7',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
    fontSize: '14px',
  } as const,

  messageError: {
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
    fontSize: '14px',
  } as const,

  smallInfo: {
    fontSize: '13px',
    color: '#64748b',
  } as const,

  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '26px',
    fontWeight: 700,
  } as const,

  sectionSubTitle: {
    margin: '0 0 18px 0',
    fontSize: '14px',
    color: '#64748b',
  } as const,

  tableWrapper: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    overflow: 'auto',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  } as const,

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    minWidth: '1000px',
  },

  th: {
    borderBottom: '1px solid #e2e8f0',
    padding: '14px 12px',
    textAlign: 'left' as const,
    backgroundColor: '#f8fafc',
    fontSize: '14px',
    fontWeight: 700,
    color: '#334155',
  },

  td: {
    borderBottom: '1px solid #f1f5f9',
    padding: '14px 12px',
    fontSize: '14px',
    verticalAlign: 'top' as const,
  },

  empty: {
    padding: '24px',
    textAlign: 'center' as const,
    color: '#64748b',
  } as const,

  badge: {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    width: 'fit-content',
  } as const,
}

export default function EditOccurrencePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const id = String(params.id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])

  const [ocorrencia, setOcorrencia] = useState('')
  const [unidade, setUnidade] = useState('')
  const [categoria, setCategoria] = useState('')
  const [prioridade, setPrioridade] = useState('')
  const [impacto, setImpacto] = useState('')
  const [estado, setEstado] = useState('Em aberto')
  const [dataReporte, setDataReporte] = useState('')
  const [dataEstado, setDataEstado] = useState('')
  const [dataEncerramento, setDataEncerramento] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [slaDias, setSlaDias] = useState<number | null>(null)

  const [originalEstado, setOriginalEstado] = useState<string | null>(null)
  const [originalDataEstado, setOriginalDataEstado] = useState<string | null>(null)
  const [originalDataReporte, setOriginalDataReporte] = useState<string | null>(null)
  const [createdBy, setCreatedBy] = useState<string | null>(null)

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentPerfil, setCurrentPerfil] = useState<string>('tecnico')

  async function loadHistory() {
    const { data } = await supabase
      .from('occurrence_history')
      .select(
        'id, occurrence_id, estado_anterior, estado_novo, observacoes, user_email, data_alteracao'
      )
      .eq('occurrence_id', id)
      .order('data_alteracao', { ascending: false })

    setHistory((data || []) as HistoryItem[])
  }

  async function loadOccurrence() {
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setErrorMessage('Sessão inválida.')
      setLoading(false)
      return
    }

    setCurrentUserId(user.id)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('perfil')
      .eq('id', user.id)
      .single()

    const perfilAtual = ((profileData as ProfileData | null)?.perfil || 'tecnico')
    setCurrentPerfil(perfilAtual)

    const { data, error } = await supabase
      .from('occurrences')
      .select(`
        id,
        ocorrencia,
        local_ocorrencia,
        categoria,
        prioridade,
        impacto,
        estado,
        data_reporte,
        data_estado,
        data_encerramento,
        observacoes,
        sla_dias,
        fora_sla,
        created_by,
        units (
          nome
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      setErrorMessage(error?.message || 'Ocorrência não encontrada.')
      setLoading(false)
      return
    }

    const item = data as Occurrence

    setCreatedBy(item.created_by)

    if (perfilAtual === 'tecnico' && item.created_by !== user.id) {
      setErrorMessage('Não tens permissão para editar esta ocorrência.')
      setLoading(false)
      return
    }

    setOcorrencia(item.ocorrencia || '')
    setUnidade(getUnitName(item.units, item.local_ocorrencia))
    setCategoria(item.categoria || '')
    setPrioridade(item.prioridade || '')
    setImpacto(item.impacto || '')
    setEstado(item.estado || 'Em aberto')
    setDataReporte(toInputDate(item.data_reporte))
    setDataEstado(toInputDateTime(item.data_estado))
    setDataEncerramento(toInputDateTime(item.data_encerramento))
    setObservacoes(item.observacoes || '')
    setSlaDias(item.sla_dias)

    setOriginalEstado(item.estado)
    setOriginalDataEstado(item.data_estado)
    setOriginalDataReporte(item.data_reporte)

    await loadHistory()
    setLoading(false)
  }

  useEffect(() => {
    if (id) {
      loadOccurrence()
    }
  }, [id])

  const canEdit = useMemo(() => {
    if (currentPerfil === 'admin' || currentPerfil === 'gestor') return true
    if (currentPerfil === 'tecnico' && currentUserId && createdBy === currentUserId) {
      return true
    }
    return false
  }, [currentPerfil, currentUserId, createdBy])

  const foraSlaAtual = useMemo(() => {
    return isForaSLA({
      data_reporte: originalDataReporte,
      data_encerramento: fromInputDateTime(dataEncerramento),
      sla_dias: slaDias,
      estado,
    })
  }, [originalDataReporte, dataEncerramento, slaDias, estado])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!canEdit) {
      setErrorMessage('Não tens permissão para editar esta ocorrência.')
      return
    }

    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    const dataEstadoIso =
      fromInputDateTime(dataEstado) ||
      (estado !== originalEstado ? new Date().toISOString() : originalDataEstado)

    let dataEncerramentoIso = fromInputDateTime(dataEncerramento)

    if ((estado === 'Concluída' || estado === 'Encerrada') && !dataEncerramentoIso) {
      dataEncerramentoIso = dataEstadoIso || new Date().toISOString()
    }

    if (estado !== 'Concluída' && estado !== 'Encerrada') {
      dataEncerramentoIso = null
    }

    const { error: updateError } = await supabase
      .from('occurrences')
      .update({
        estado,
        data_estado: dataEstadoIso,
        data_encerramento: dataEncerramentoIso,
        observacoes: observacoes.trim() || null,
      })
      .eq('id', id)

    if (updateError) {
      setErrorMessage(updateError.message)
      setSaving(false)
      return
    }

    if (originalEstado !== estado) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error: historyError } = await supabase.from('occurrence_history').insert({
        occurrence_id: id,
        estado_anterior: originalEstado,
        estado_novo: estado,
        observacoes: observacoes.trim() || null,
        user_email: user?.email || null,
        data_alteracao: dataEstadoIso || new Date().toISOString(),
      })

      if (historyError) {
        setErrorMessage(`Ocorrência guardada, mas sem histórico: ${historyError.message}`)
        setSaving(false)
        await loadOccurrence()
        return
      }
    }

    setSuccessMessage('Alterações guardadas com sucesso.')
    setSaving(false)
    await loadOccurrence()
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Editar Ocorrência</h1>
          <div style={styles.subtitle}>
            Consulta os dados, atualiza o estado e regista observações da intervenção.
          </div>
          <div style={{ marginTop: 8 }}>
            <Link href="/dashboard" style={styles.backLink}>
              ← Voltar ao dashboard
            </Link>
          </div>
        </div>
      </div>

      {errorMessage && <div style={styles.messageError}>{errorMessage}</div>}
      {successMessage && <div style={styles.messageSuccess}>{successMessage}</div>}

      {loading ? (
        <div style={styles.card}>A carregar...</div>
      ) : !canEdit ? (
        <div style={styles.card}>Não tens permissão para editar esta ocorrência.</div>
      ) : (
        <>
          <div style={styles.topSummaryGrid}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Estado atual</div>
              <div style={styles.summaryValue}>
                <span
                  style={{
                    ...styles.badge,
                    ...getEstadoBadgeStyle(estado),
                  }}
                >
                  {estado || '-'}
                </span>
              </div>
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>SLA</div>
              <div style={styles.summaryValue}>
                <span
                  style={{
                    ...styles.badge,
                    backgroundColor: foraSlaAtual ? '#dc2626' : '#16a34a',
                    color: '#ffffff',
                  }}
                >
                  {foraSlaAtual ? 'Fora SLA' : 'Dentro SLA'}
                </span>
              </div>
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Data reporte</div>
              <div style={styles.summaryValue}>{formatDate(originalDataReporte)}</div>
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Prazo SLA</div>
              <div style={styles.summaryValue}>
                {slaDias == null ? '-' : `${slaDias} dias`}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Dados da ocorrência</h2>
              <div style={styles.sectionSubTitle}>
                Os dados base ficam visíveis e o estado pode ser atualizado conforme a evolução.
              </div>

              <div style={styles.grid}>
                <div style={styles.field}>
                  <label style={styles.label}>Ocorrência</label>
                  <input
                    style={{ ...styles.input, ...styles.readOnly }}
                    value={ocorrencia}
                    readOnly
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Unidade</label>
                  <input
                    style={{ ...styles.input, ...styles.readOnly }}
                    value={unidade}
                    readOnly
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Categoria</label>
                  <input
                    style={{ ...styles.input, ...styles.readOnly }}
                    value={categoria}
                    readOnly
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Prioridade</label>
                  <div
                    style={{
                      ...styles.badge,
                      ...getPrioridadeBadgeStyle(prioridade),
                      marginTop: '8px',
                    }}
                  >
                    {prioridade || '-'}
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Impacto</label>
                  <div
                    style={{
                      ...styles.badge,
                      ...getImpactoBadgeStyle(impacto),
                      marginTop: '8px',
                    }}
                  >
                    {impacto || '-'}
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Estado</label>
                  <select
                    style={styles.input}
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                  >
                    {ESTADOS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Data reporte</label>
                  <input
                    type="date"
                    style={{ ...styles.input, ...styles.readOnly }}
                    value={dataReporte}
                    readOnly
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Data alteração de estado</label>
                  <input
                    type="datetime-local"
                    style={styles.input}
                    value={dataEstado}
                    onChange={(e) => setDataEstado(e.target.value)}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Data fim</label>
                  <input
                    type="datetime-local"
                    style={styles.input}
                    value={dataEncerramento}
                    onChange={(e) => setDataEncerramento(e.target.value)}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>SLA</label>
                  <input
                    style={{ ...styles.input, ...styles.readOnly }}
                    value={slaDias == null ? '-' : `${slaDias} dias`}
                    readOnly
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Situação SLA</label>
                  <div
                    style={{
                      ...styles.badge,
                      backgroundColor: foraSlaAtual ? '#dc2626' : '#16a34a',
                      color: '#ffffff',
                      marginTop: '8px',
                    }}
                  >
                    {foraSlaAtual ? 'Fora SLA' : 'Dentro SLA'}
                  </div>
                </div>

                <div style={styles.fieldFull}>
                  <label style={styles.label}>Observações</label>
                  <textarea
                    style={styles.textarea}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                  />
                  <div style={styles.smallInfo}>
                    Sempre que mudares o estado e guardares, a alteração ficará registada no histórico.
                  </div>
                </div>
              </div>

              <div style={styles.actions}>
                <button type="submit" style={styles.btnPrimary} disabled={saving}>
                  {saving ? 'A guardar...' : 'Guardar alterações'}
                </button>

                <button
                  type="button"
                  style={styles.btnSecondary}
                  onClick={() => router.push('/dashboard')}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Histórico de estados</h2>
            <div style={styles.sectionSubTitle}>
              Registo das alterações efetuadas nesta ocorrência.
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Data</th>
                    <th style={styles.th}>Estado anterior</th>
                    <th style={styles.th}>Novo estado</th>
                    <th style={styles.th}>Utilizador</th>
                    <th style={styles.th}>Observações</th>
                  </tr>
                </thead>

                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={styles.empty}>
                        Sem histórico registado.
                      </td>
                    </tr>
                  ) : (
                    history.map((item) => (
                      <tr key={item.id}>
                        <td style={styles.td}>{formatDateTime(item.data_alteracao)}</td>
                        <td style={styles.td}>{item.estado_anterior || '-'}</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              ...getEstadoBadgeStyle(item.estado_novo),
                            }}
                          >
                            {item.estado_novo}
                          </span>
                        </td>
                        <td style={styles.td}>{item.user_email || '-'}</td>
                        <td style={styles.td}>{item.observacoes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
