'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/client'
import { ESTADOS } from '../../../../lib/constants'
import DashboardTopbar from '../../../../components/dashboard/DashboardTopbar'

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
  created_by_email: string | null
  updated_by_email: string | null
  foto_url: string | null
  satisfaction_requested_at?: string | null
  satisfaction_submitted_at?: string | null
  satisfaction_score?: number | null
  satisfaction_comment?: string | null
  assigned_gestor?: string | null
  assigned_gestor_email?: string | null
  assigned_gestor_at?: string | null
  assigned_tecnico?: string | null
  assigned_tecnico_email?: string | null
  assigned_tecnico_at?: string | null
  forwarded_by?: string | null
  forwarded_by_email?: string | null
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
  role: string | null
}

type UserOption = {
  id: string
  nome: string | null
  email: string | null
  role: string | null
  ativo: boolean | null
}

type EstadoValue = (typeof ESTADOS)[number]
type EstadoSemEncerrada = Exclude<EstadoValue, 'Encerrada'>

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

function isForaPrazo(item: {
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
    return { backgroundColor: '#dcfce7', color: '#166534' }
  }

  if (estado === 'Encerrada') {
    return { backgroundColor: '#e2e8f0', color: '#334155' }
  }

  if (estado === 'Em execução') {
    return { backgroundColor: '#dbeafe', color: '#1d4ed8' }
  }

  if (estado === 'Em análise') {
    return { backgroundColor: '#fef3c7', color: '#92400e' }
  }

  return { backgroundColor: '#ede9fe', color: '#6d28d9' }
}

function getPrioridadeBadgeStyle(prioridade: string | null) {
  if (prioridade === 'Alta') {
    return { backgroundColor: '#fee2e2', color: '#b91c1c' }
  }

  if (prioridade === 'Média') {
    return { backgroundColor: '#fef3c7', color: '#92400e' }
  }

  if (prioridade === 'Baixa') {
    return { backgroundColor: '#dcfce7', color: '#166534' }
  }

  return { backgroundColor: '#f1f5f9', color: '#475569' }
}

function getImpactoBadgeStyle(impacto: string | null) {
  if (impacto === 'Crítico') {
    return { backgroundColor: '#fee2e2', color: '#b91c1c' }
  }

  if (impacto === 'Alto') {
    return { backgroundColor: '#ffedd5', color: '#c2410c' }
  }

  if (impacto === 'Médio') {
    return { backgroundColor: '#fef3c7', color: '#a16207' }
  }

  if (impacto === 'Baixo') {
    return { backgroundColor: '#dcfce7', color: '#166534' }
  }

  return { backgroundColor: '#f1f5f9', color: '#475569' }
}

function isEstadoValue(value: string | null): value is EstadoValue {
  return !!value && (ESTADOS as readonly string[]).includes(value)
}

function getUserDisplayName(item: UserOption | null | undefined) {
  if (!item) return '-'
  return item.nome || item.email || '-'
}

const styles = {
  page: {
    padding: '24px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
    color: '#0f172a',
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

  btnLink: {
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
    width: 'fit-content',
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

  imageWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginTop: '8px',
  } as const,

  imagePreview: {
    maxWidth: '420px',
    maxHeight: '300px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    objectFit: 'cover' as const,
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
  const [estado, setEstado] = useState<string>('Em aberto')
  const [dataReporte, setDataReporte] = useState('')
  const [dataEstado, setDataEstado] = useState('')
  const [dataEncerramento, setDataEncerramento] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [slaDias, setSlaDias] = useState<number | null>(null)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [fotoSignedUrl, setFotoSignedUrl] = useState<string>('')

  const [createdByEmail, setCreatedByEmail] = useState<string | null>(null)
  const [updatedByEmail, setUpdatedByEmail] = useState<string | null>(null)
  const [satisfactionRequestedAt, setSatisfactionRequestedAt] = useState<string | null>(null)
  const [satisfactionSubmittedAt, setSatisfactionSubmittedAt] = useState<string | null>(null)
  const [satisfactionScore, setSatisfactionScore] = useState<number | null>(null)
  const [satisfactionComment, setSatisfactionComment] = useState<string | null>(null)

  const [assignedGestorId, setAssignedGestorId] = useState('')
  const [assignedGestorEmail, setAssignedGestorEmail] = useState<string | null>(null)
  const [assignedGestorAt, setAssignedGestorAt] = useState<string | null>(null)

  const [assignedTecnicoId, setAssignedTecnicoId] = useState('')
  const [assignedTecnicoEmail, setAssignedTecnicoEmail] = useState<string | null>(null)
  const [assignedTecnicoAt, setAssignedTecnicoAt] = useState<string | null>(null)

  const [gestores, setGestores] = useState<UserOption[]>([])
  const [tecnicos, setTecnicos] = useState<UserOption[]>([])

  const [originalEstado, setOriginalEstado] = useState<string | null>(null)
  const [originalDataEstado, setOriginalDataEstado] = useState<string | null>(null)
  const [originalDataReporte, setOriginalDataReporte] = useState<string | null>(null)
  const [createdBy, setCreatedBy] = useState<string | null>(null)
  const [originalAssignedGestorId, setOriginalAssignedGestorId] = useState<string>('')
  const [originalAssignedTecnicoId, setOriginalAssignedTecnicoId] = useState<string>('')

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentRole, setCurrentRole] = useState<string>('user')

  const selectedGestor = useMemo(
    () => gestores.find((item) => item.id === assignedGestorId) || null,
    [gestores, assignedGestorId]
  )

  const selectedTecnico = useMemo(
    () => tecnicos.find((item) => item.id === assignedTecnicoId) || null,
    [tecnicos, assignedTecnicoId]
  )

  async function loadAssignableUsers() {
    const { data: gestoresData } = await supabase
      .from('profiles')
      .select('id, nome, email, role, ativo')
      .eq('role', 'gestor')
      .eq('ativo', true)
      .order('nome', { ascending: true })

    const { data: tecnicosData } = await supabase
      .from('profiles')
      .select('id, nome, email, role, ativo')
      .eq('role', 'tecnico')
      .eq('ativo', true)
      .order('nome', { ascending: true })

    setGestores((gestoresData || []) as UserOption[])
    setTecnicos((tecnicosData || []) as UserOption[])
  }

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
    setFotoSignedUrl('')

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
      .select('role')
      .eq('id', user.id)
      .single()

    const roleAtual = ((profileData as ProfileData | null)?.role || 'user')
    setCurrentRole(roleAtual)

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
        created_by_email,
        updated_by_email,
        foto_url,
        satisfaction_requested_at,
        satisfaction_submitted_at,
        satisfaction_score,
        satisfaction_comment,
        assigned_gestor,
        assigned_gestor_email,
        assigned_gestor_at,
        assigned_tecnico,
        assigned_tecnico_email,
        assigned_tecnico_at,
        forwarded_by,
        forwarded_by_email,
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

    const canOpen =
      roleAtual === 'admin' ||
      roleAtual === 'consulta' ||
      (roleAtual === 'gestor' &&
        (item.assigned_gestor === user.id || item.created_by === user.id)) ||
      (roleAtual === 'tecnico' &&
        (item.assigned_tecnico === user.id || item.created_by === user.id)) ||
      (roleAtual === 'user' && item.created_by === user.id)

    if (!canOpen) {
      setErrorMessage('Não tens permissão para consultar esta ocorrência.')
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
    setFotoUrl(item.foto_url || null)
    setCreatedByEmail(item.created_by_email || null)
    setUpdatedByEmail(item.updated_by_email || null)
    setSatisfactionRequestedAt(item.satisfaction_requested_at || null)
    setSatisfactionSubmittedAt(item.satisfaction_submitted_at || null)
    setSatisfactionScore(item.satisfaction_score ?? null)
    setSatisfactionComment(item.satisfaction_comment || null)

    setAssignedGestorId(item.assigned_gestor || '')
    setAssignedGestorEmail(item.assigned_gestor_email || null)
    setAssignedGestorAt(item.assigned_gestor_at || null)

    setAssignedTecnicoId(item.assigned_tecnico || '')
    setAssignedTecnicoEmail(item.assigned_tecnico_email || null)
    setAssignedTecnicoAt(item.assigned_tecnico_at || null)

    setOriginalAssignedGestorId(item.assigned_gestor || '')
    setOriginalAssignedTecnicoId(item.assigned_tecnico || '')

    setOriginalEstado(item.estado)
    setOriginalDataEstado(item.data_estado)
    setOriginalDataReporte(item.data_reporte)

    if (item.foto_url) {
      const { data: signedData, error: signedError } = await supabase.storage
        .from('ocorrencias')
        .createSignedUrl(item.foto_url, 3600)

      if (signedError) {
        console.error('Erro ao gerar signed URL da foto:', signedError)
      } else {
        setFotoSignedUrl(signedData.signedUrl)
      }
    }

    await loadAssignableUsers()
    await loadHistory()
    setLoading(false)
  }

  useEffect(() => {
    if (id) {
      void loadOccurrence()
    }
  }, [id])

  const canEdit = useMemo(() => {
    if (currentRole === 'admin') return true

    if (currentRole === 'gestor' && currentUserId) {
      return assignedGestorId === currentUserId || createdBy === currentUserId
    }

    if (currentRole === 'tecnico' && currentUserId) {
      return assignedTecnicoId === currentUserId || createdBy === currentUserId
    }

    if (currentRole === 'user' && currentUserId && createdBy === currentUserId) {
      return true
    }

    return false
  }, [currentRole, currentUserId, createdBy, assignedGestorId, assignedTecnicoId])

  const canSeeAudit =
    currentRole === 'admin' ||
    currentRole === 'gestor' ||
    currentRole === 'tecnico' ||
    currentRole === 'consulta'

  const canForwardToGestor = currentRole === 'admin'
  const canForwardToTecnico =
    currentRole === 'gestor' && currentUserId != null && assignedGestorId === currentUserId

  const foraPrazoAtual = useMemo(() => {
    return isForaPrazo({
      data_reporte: originalDataReporte,
      data_encerramento: fromInputDateTime(dataEncerramento),
      sla_dias: slaDias,
      estado,
    })
  }, [originalDataReporte, dataEncerramento, slaDias, estado])

  const estadosDisponiveis = useMemo<(EstadoSemEncerrada | 'Encerrada')[]>(() => {
    const base: EstadoSemEncerrada[] = ESTADOS.filter(
      (item): item is EstadoSemEncerrada => item !== 'Encerrada'
    )

    if (!isEstadoValue(estado)) {
      return base
    }

    if (estado === 'Encerrada') {
      return [estado, ...base]
    }

    const existsInBase = base.some((item) => item === estado)

    if (!existsInBase) {
      return [estado, ...base]
    }

    return base
  }, [estado])

  async function sendConclusionEmail() {
    if (!createdByEmail) return

    const response = await fetch('/api/notify-occurrence-closed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        occurrenceId: id,
        recipientEmail: createdByEmail,
        occurrenceTitle: ocorrencia,
        unitName: unidade,
      }),
    })

    if (!response.ok) {
      const result = await response.json().catch(() => null)
      throw new Error(result?.error || 'Não foi possível enviar o email de avaliação.')
    }
  }

  async function sendEmail(to: string, subject: string, message: string) {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, message }),
    })

    if (!response.ok) {
      const result = await response.json().catch(() => null)
      throw new Error(result?.error || 'Não foi possível enviar o email.')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!canEdit && !canForwardToGestor && !canForwardToTecnico) {
      setErrorMessage('Não tens permissão para editar esta ocorrência.')
      return
    }

    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const dataEstadoIso =
      fromInputDateTime(dataEstado) ||
      (estado !== originalEstado ? new Date().toISOString() : originalDataEstado)

    let dataEncerramentoIso = fromInputDateTime(dataEncerramento)

    if (estado === 'Concluída' && !dataEncerramentoIso) {
      dataEncerramentoIso = dataEstadoIso || new Date().toISOString()
    }

    if (estado !== 'Concluída') {
      dataEncerramentoIso = null
    }

    const nowIso = new Date().toISOString()

    const nextAssignedGestorEmail =
      assignedGestorId && selectedGestor ? selectedGestor.email || null : null

    const nextAssignedTecnicoEmail =
      assignedTecnicoId && selectedTecnico ? selectedTecnico.email || null : null

    const updatePayload: Record<string, any> = {
      estado,
      data_estado: dataEstadoIso,
      data_encerramento: dataEncerramentoIso,
      observacoes: observacoes.trim() || null,
      updated_by_email: user?.email || updatedByEmail || null,
    }

    const gestorChanged =
      canForwardToGestor && assignedGestorId !== originalAssignedGestorId

    const tecnicoChanged =
      canForwardToTecnico && assignedTecnicoId !== originalAssignedTecnicoId

    if (gestorChanged) {
      updatePayload.assigned_gestor = assignedGestorId || null
      updatePayload.assigned_gestor_email = nextAssignedGestorEmail
      updatePayload.assigned_gestor_at = assignedGestorId ? nowIso : null
      updatePayload.forwarded_by = user?.id || null
      updatePayload.forwarded_by_email = user?.email || null

      if (!assignedGestorId) {
        updatePayload.assigned_tecnico = null
        updatePayload.assigned_tecnico_email = null
        updatePayload.ass
