'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import DashboardTopbar from '../../../components/dashboard/DashboardTopbar'

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
  fora_sla: boolean | null
  sla_dias: number | null
  satisfaction_score?: number | null
  satisfaction_comment?: string | null
  satisfaction_submitted_at?: string | null
  assigned_gestor?: string | null
  assigned_tecnico?: string | null
  created_by?: string | null
  units: UnitRelation
}

type Profile = {
  id: string
  nome: string | null
  email: string | null
  role: string | null
  ativo: boolean | null
  [key: string]: unknown
}

type UnitSummary = {
  unidade: string
  total: number
  emAberto: number
  emAnalise: number
  emExecucao: number
  concluidas: number
  encerradas: number
  foraPrazo: number
}

type CategorySummary = {
  categoria: string
  total: number
  emAberto: number
  emAnalise: number
  emExecucao: number
  concluidas: number
  encerradas: number
  foraPrazo: number
}

type MonthlySummary = {
  mes: string
  chave: string
  total: number
  abertas: number
  concluidas: number
}

function getUnitName(units: UnitRelation, fallback: string | null) {
  if (Array.isArray(units)) {
    return units[0]?.nome || fallback || '-'
  }
  return units?.nome || fallback || '-'
}

function normalizeCategoria(value: string | null) {
  return value || 'Sem categoria'
}

function parseDateSafe(dateString: string) {
  if (!dateString) return null

  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    const date = new Date(dateString)
    if (!Number.isNaN(date.getTime())) return date
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('/')
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    if (!Number.isNaN(date.getTime())) return date
  }

  const fallback = new Date(dateString)
  if (!Number.isNaN(fallback.getTime())) return fallback

  return null
}

function normalizeEstado(estado: string | null) {
  return (estado || '').trim().toLowerCase()
}

function isClosedEstado(estado: string | null) {
  const normalized = normalizeEstado(estado)
  return (
    normalized === 'concluída' ||
    normalized === 'concluida' ||
    normalized === 'encerrada' ||
    normalized === 'resolvida'
  )
}

function isOpenEstado(estado: string | null) {
  return !isClosedEstado(estado)
}

function hasSla(item: Occurrence) {
  return item.sla_dias != null && item.data_reporte != null
}

function getForaPrazoValue(item: Occurrence) {
  if (!hasSla(item)) return false
  if (isClosedEstado(item.estado)) return false

  const dataReporte = parseDateSafe(item.data_reporte as string)
  if (!dataReporte) return false

  const inicio = new Date(dataReporte)
  inicio.setHours(0, 0, 0, 0)

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const prazoFinal = new Date(inicio)
  prazoFinal.setDate(prazoFinal.getDate() + Number(item.sla_dias))

  return hoje > prazoFinal
}

function getDentroPrazoValue(item: Occurrence) {
  if (!hasSla(item)) return false
  if (isClosedEstado(item.estado)) return false
  return !getForaPrazoValue(item)
}

function percent(value: number, total: number) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-'
  const date = parseDateSafe(dateString)
  if (!date) return '-'
  return date.toLocaleDateString('pt-PT')
}

function calcResolutionDays(item: Occurrence) {
  if (!item.data_reporte || !item.data_encerramento) return null

  const inicio = parseDateSafe(item.data_reporte)?.getTime()
  const fim = parseDateSafe(item.data_encerramento)?.getTime()

  if (inicio == null || fim == null || Number.isNaN(inicio) || Number.isNaN(fim) || fim < inicio) {
    return null
  }

  return (fim - inicio) / (1000 * 60 * 60 * 24)
}

function calcDiasAtraso(item: Occurrence) {
  if (!hasSla(item)) return 0
  if (isClosedEstado(item.estado)) return 0

  const inicio = parseDateSafe(item.data_reporte as string)?.getTime()
  if (inicio == null || Number.isNaN(inicio)) return 0

  const prazoMs = Number(item.sla_dias) * 24 * 60 * 60 * 1000
  const limite = inicio + prazoMs

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const referencia = hoje.getTime()

  const atrasoMs = referencia - limite
  if (atrasoMs <= 0) return 0

  return Math.ceil(atrasoMs / (1000 * 60 * 60 * 24))
}

function resolveAvatarUrl(
  profileData: Record<string, unknown> | null | undefined
) {
  const candidates = [
    profileData?.avatar_url,
    profileData?.foto_url,
    profileData?.foto,
    profileData?.imagem_url,
    profileData?.imagem,
    profileData?.image_url,
    profileData?.profile_image,
    profileData?.profile_image_url,
    profileData?.photo_url,
    profileData?.picture,
  ]

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return null
}

function exportUnitsCSV(lista: UnitSummary[]) {
  const headers = [
    'Unidade',
    'Total',
    'Em aberto',
    'Em análise',
    'Em execução',
    'Concluídas',
    'Encerradas',
    'Fora do prazo',
  ]

  const rows = lista.map((item) => [
    item.unidade,
    item.total,
    item.emAberto,
    item.emAnalise,
    item.emExecucao,
    item.concluidas,
    item.encerradas,
    item.foraPrazo,
  ])

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\n')

  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'relatorio_unidades.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function exportCategoriesCSV(lista: CategorySummary[]) {
  const headers = [
    'Categoria',
    'Total',
    'Em aberto',
    'Em análise',
    'Em execução',
    'Concluídas',
    'Encerradas',
    'Fora do prazo',
  ]

  const rows = lista.map((item) => [
    item.categoria,
    item.total,
    item.emAberto,
    item.emAnalise,
    item.emExecucao,
    item.concluidas,
    item.encerradas,
    item.foraPrazo,
  ])

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\n')

  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'relatorio_categorias.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const styles = {
  page: {
    padding: '24px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
    color: '#0f172a',
  } as const,

  btn: {
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

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  } as const,

  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  } as const,

  cardTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#334155',
  } as const,

  cardValue: {
    margin: 0,
    fontSize: '34px',
    fontWeight: 700,
    color: '#0f172a',
  } as const,

  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '20px',
    marginBottom: '28px',
  } as const,

  chartCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  } as const,

  chartTitle: {
    margin: '0 0 16px 0',
    fontSize: '20px',
    fontWeight: 700,
  } as const,

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    marginTop: '24px',
    marginBottom: '12px',
    flexWrap: 'wrap' as const,
  } as const,

  sectionTitle: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
  } as const,

  sectionSubtitle: {
    marginTop: '6px',
    fontSize: '14px',
    color: '#64748b',
  } as const,

  tableWrapper: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    overflow: 'auto',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
    marginBottom: '32px',
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

  error: {
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
  } as const,

  progressGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },

  progressRow: {
    display: 'grid',
    gridTemplateColumns: '140px 1fr 60px',
    gap: '12px',
    alignItems: 'center',
  } as const,

  progressLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#334155',
    overflow: 'hidden',
    whiteSpace: 'nowrap' as const,
    textOverflow: 'ellipsis',
  } as const,

  progressTrack: {
    width: '100%',
    height: '16px',
    backgroundColor: '#e2e8f0',
    borderRadius: '999px',
    overflow: 'hidden',
  } as const,

  progressValue: {
    height: '100%',
    borderRadius: '999px',
  } as const,

  progressNumber: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#475569',
    textAlign: 'right' as const,
  } as const,

  donutWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 0 4px 0',
  } as const,

  donut: {
    width: '220px',
    height: '220px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  } as const,

  donutInner: {
    width: '126px',
    height: '126px',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column' as const,
    boxShadow: 'inset 0 0 0 1px #e2e8f0',
  } as const,

  donutBig: {
    fontSize: '26px',
    fontWeight: 700,
    color: '#0f172a',
    lineHeight: 1,
  } as const,

  donutSmall: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '6px',
  } as const,

  legendList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginTop: '18px',
  },

  legendRow: {
    display: 'grid',
    gridTemplateColumns: '18px 1fr auto',
    gap: '10px',
    alignItems: 'center',
    fontSize: '14px',
  } as const,

  legendDot: {
    width: '14px',
    height: '14px',
    borderRadius: '999px',
  } as const,

  monthlyChartWrap: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '14px',
    minHeight: '280px',
    paddingTop: '10px',
    overflowX: 'auto' as const,
  },

  monthlyColumn: {
    minWidth: '72px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
  },

  monthlyValue: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#334155',
  } as const,

  monthlyBarArea: {
    width: '44px',
    height: '190px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '4px',
  } as const,

  monthlyBar: {
    width: '100%',
    borderRadius: '10px 10px 0 0',
    minHeight: '8px',
  } as const,

  monthlyBarNarrow: {
    width: '20px',
    borderRadius: '8px 8px 0 0',
    minHeight: '8px',
  } as const,

  monthlyLabel: {
    fontSize: '12px',
    color: '#64748b',
    textAlign: 'center' as const,
    lineHeight: 1.2,
  } as const,

  smallLegend: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
    marginTop: '10px',
  },

  smallLegendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#475569',
  } as const,

  topAlert: {
    backgroundColor: '#fff7ed',
    border: '1px solid #fdba74',
    borderRadius: '12px',
    padding: '12px 14px',
    marginBottom: '10px',
  } as const,

  topAlertTitle: {
    margin: '0 0 6px 0',
    fontSize: '15px',
    fontWeight: 700,
    color: '#9a3412',
  } as const,

  topAlertText: {
    margin: 0,
    fontSize: '14px',
    color: '#7c2d12',
  } as const,
}

function HorizontalBars({
  title,
  items,
  labelKey,
  valueKey,
  color,
}: {
  title: string
  items: Record<string, string | number>[]
  labelKey: string
  valueKey: string
  color: string
}) {
  const maxValue = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 0)

  return (
    <div style={styles.chartCard}>
      <h2 style={styles.chartTitle}>{title}</h2>

      {items.length === 0 ? (
        <div style={styles.empty}>Sem dados</div>
      ) : (
        <div style={styles.progressGroup}>
          {items.map((item, index) => {
            const value = Number(item[valueKey] || 0)
            const width = maxValue > 0 ? `${(value / maxValue) * 100}%` : '0%'
            const label = String(item[labelKey] || '-')

            return (
              <div key={`${label}-${index}`} style={styles.progressRow}>
                <div style={styles.progressLabel} title={label}>
                  {label}
                </div>

                <div style={styles.progressTrack}>
                  <div
                    style={{
                      ...styles.progressValue,
                      width,
                      backgroundColor: color,
                    }}
                  />
                </div>

                <div style={styles.progressNumber}>{value}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DonutCard({
  title,
  valueA,
  valueB,
  labelA,
  labelB,
  colorA,
  colorB,
}: {
  title: string
  valueA: number
  valueB: number
  labelA: string
  labelB: string
  colorA: string
  colorB: string
}) {
  const total = valueA + valueB
  const percentA = total ? Math.round((valueA / total) * 100) : 0
  const angleA = `${percentA}%`
  const background = `conic-gradient(${colorA} 0 ${angleA}, ${colorB} ${angleA} 100%)`

  return (
    <div style={styles.chartCard}>
      <h2 style={styles.chartTitle}>{title}</h2>

      <div style={styles.donutWrap}>
        <div style={{ ...styles.donut, background }}>
          <div style={styles.donutInner}>
            <div style={styles.donutBig}>{total}</div>
            <div style={styles.donutSmall}>total</div>
          </div>
        </div>
      </div>

      <div style={styles.legendList}>
        <div style={styles.legendRow}>
          <div style={{ ...styles.legendDot, backgroundColor: colorA }} />
          <div>{labelA}</div>
          <strong>
            {valueA} ({percent(valueA, total)}%)
          </strong>
        </div>

        <div style={styles.legendRow}>
          <div style={{ ...styles.legendDot, backgroundColor: colorB }} />
          <div>{labelB}</div>
          <strong>
            {valueB} ({percent(valueB, total)}%)
          </strong>
        </div>
      </div>
    </div>
  )
}

function MonthlyEvolutionCard({
  title,
  items,
  color,
}: {
  title: string
  items: MonthlySummary[]
  color: string
}) {
  const maxValue = Math.max(...items.map((item) => item.total), 0)

  return (
    <div style={styles.chartCard}>
      <h2 style={styles.chartTitle}>{title}</h2>

      {items.length === 0 ? (
        <div style={styles.empty}>Sem dados</div>
      ) : (
        <div style={styles.monthlyChartWrap}>
          {items.map((item) => {
            const height = maxValue > 0 ? `${(item.total / maxValue) * 100}%` : '0%'

            return (
              <div key={item.chave} style={styles.monthlyColumn}>
                <div style={styles.monthlyValue}>{item.total}</div>

                <div style={styles.monthlyBarArea}>
                  <div
                    style={{
                      ...styles.monthlyBar,
                      height,
                      backgroundColor: color,
                    }}
                  />
                </div>

                <div style={styles.monthlyLabel}>{item.mes}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MonthlyOpenClosedCard({
  title,
  items,
}: {
  title: string
  items: MonthlySummary[]
}) {
  const maxValue = Math.max(...items.flatMap((item) => [item.abertas, item.concluidas]), 0)

  return (
    <div style={styles.chartCard}>
      <h2 style={styles.chartTitle}>{title}</h2>

      {items.length === 0 ? (
        <div style={styles.empty}>Sem dados</div>
      ) : (
        <>
          <div style={styles.monthlyChartWrap}>
            {items.map((item) => {
              const heightA = maxValue > 0 ? `${(item.abertas / maxValue) * 100}%` : '0%'
              const heightB = maxValue > 0 ? `${(item.concluidas / maxValue) * 100}%` : '0%'

              return (
                <div key={item.chave} style={styles.monthlyColumn}>
                  <div style={styles.monthlyValue}>{item.abertas + item.concluidas}</div>

                  <div style={{ ...styles.monthlyBarArea, justifyContent: 'center' }}>
                    <div
                      style={{
                        ...styles.monthlyBarNarrow,
                        height: heightA,
                        backgroundColor: '#2563eb',
                      }}
                    />
                    <div
                      style={{
                        ...styles.monthlyBarNarrow,
                        height: heightB,
                        backgroundColor: '#16a34a',
                      }}
                    />
                  </div>

                  <div style={styles.monthlyLabel}>{item.mes}</div>
                </div>
              )
            })}
          </div>

          <div style={styles.smallLegend}>
            <div style={styles.smallLegendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: '#2563eb' }} />
              Abertas
            </div>
            <div style={styles.smallLegendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: '#16a34a' }} />
              Concluídas
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function RelatoriosPage() {
  const supabase = createClient()
  const router = useRouter()

  const [rows, setRows] = useState<Occurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [role, setRole] = useState<string>('user')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  async function loadOccurrences() {
    setLoading(true)
    setErrorMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setErrorMessage('Sessão inválida.')
      setRows([])
      setLoading(false)
      return
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      setErrorMessage(profileError.message)
      setLoading(false)
      return
    }

    const currentProfile = (profileData || null) as Profile | null
    setProfile(currentProfile)
    setRole(currentProfile?.role || 'user')
    setAvatarUrl(resolveAvatarUrl(currentProfile))

    if (currentProfile?.ativo === false) {
      await supabase.auth.signOut()
      router.replace('/login')
      return
    }

    const currentRole = currentProfile?.role || 'user'

    if (currentRole === 'user') {
      router.replace('/dashboard')
      return
    }

    let query = supabase
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
        fora_sla,
        sla_dias,
        satisfaction_score,
        satisfaction_comment,
        satisfaction_submitted_at,
        assigned_gestor,
        assigned_tecnico,
        created_by,
        units (
          nome
        )
      `)
      .order('data_reporte', { ascending: false })

    if (currentRole === 'gestor') {
      query = query.eq('assigned_gestor', user.id)
    } else if (currentRole === 'tecnico') {
      query = query.eq('assigned_tecnico', user.id)
    } else if (currentRole === 'admin' || currentRole === 'consulta') {
      // vê tudo
    } else {
      query = query.eq('created_by', user.id)
    }

    const { data, error } = await query

    if (error) {
      setErrorMessage(error.message)
      setRows([])
      setLoading(false)
      return
    }

    setRows((data || []) as Occurrence[])
    setLoading(false)
  }

  useEffect(() => {
    void loadOccurrences()
  }, [])

  const resumoPorUnidade = useMemo(() => {
    const map = new Map<string, UnitSummary>()

    rows.forEach((item) => {
      const unidade = getUnitName(item.units, item.local_ocorrencia)
      const estadoAtual = item.estado || '-'
      const foraPrazoAtual = getForaPrazoValue(item)

      if (!map.has(unidade)) {
        map.set(unidade, {
          unidade,
          total: 0,
          emAberto: 0,
          emAnalise: 0,
          emExecucao: 0,
          concluidas: 0,
          encerradas: 0,
          foraPrazo: 0,
        })
      }

      const current = map.get(unidade)!
      current.total += 1

      if (estadoAtual === 'Em aberto') current.emAberto += 1
      if (estadoAtual === 'Em análise') current.emAnalise += 1
      if (estadoAtual === 'Em execução') current.emExecucao += 1
      if (estadoAtual === 'Concluída') current.concluidas += 1
      if (estadoAtual === 'Encerrada') current.encerradas += 1
      if (foraPrazoAtual) current.foraPrazo += 1
    })

    return Array.from(map.values()).sort((a, b) => a.unidade.localeCompare(b.unidade))
  }, [rows])

  const resumoPorCategoria = useMemo(() => {
    const map = new Map<string, CategorySummary>()

    rows.forEach((item) => {
      const categoriaAtual = normalizeCategoria(item.categoria)
      const estadoAtual = item.estado || '-'
      const foraPrazoAtual = getForaPrazoValue(item)

      if (!map.has(categoriaAtual)) {
        map.set(categoriaAtual, {
          categoria: categoriaAtual,
          total: 0,
          emAberto: 0,
          emAnalise: 0,
          emExecucao: 0,
          concluidas: 0,
          encerradas: 0,
          foraPrazo: 0,
        })
      }

      const current = map.get(categoriaAtual)!
      current.total += 1

      if (estadoAtual === 'Em aberto') current.emAberto += 1
      if (estadoAtual === 'Em análise') current.emAnalise += 1
      if (estadoAtual === 'Em execução') current.emExecucao += 1
      if (estadoAtual === 'Concluída') current.concluidas += 1
      if (estadoAtual === 'Encerrada') current.encerradas += 1
      if (foraPrazoAtual) current.foraPrazo += 1
    })

    return Array.from(map.values()).sort((a, b) => a.categoria.localeCompare(b.categoria))
  }, [rows])

  const total = rows.length

  const totalConcluidas = rows.filter(
    (o) => o.estado === 'Concluída' || o.estado === 'Encerrada'
  ).length

  const totalAbertas = rows.filter((o) => isOpenEstado(o.estado)).length

  const ocorrenciasAbertasComSla = rows.filter((o) => isOpenEstado(o.estado) && hasSla(o))
  const totalForaPrazo = ocorrenciasAbertasComSla.filter((o) => getForaPrazoValue(o)).length
  const totalDentroPrazo = ocorrenciasAbertasComSla.filter((o) => getDentroPrazoValue(o)).length

  const avaliacoes = rows.filter(
    (item) => item.satisfaction_score != null && item.satisfaction_submitted_at
  )

  const mediaSatisfacao =
    avaliacoes.length > 0
      ? Math.round(
          (avaliacoes.reduce((acc, item) => acc + Number(item.satisfaction_score || 0), 0) /
            avaliacoes.length) *
            10
        ) / 10
      : 0

  const graficoUnidades = useMemo(() => {
    return [...resumoPorUnidade]
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((item) => ({
        unidade: item.unidade,
        total: item.total,
      }))
  }, [resumoPorUnidade])

  const graficoCategorias = useMemo(() => {
    return [...resumoPorCategoria]
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((item) => ({
        categoria: item.categoria,
        total: item.total,
      }))
  }, [resumoPorCategoria])

  const graficoPrioridade = useMemo(() => {
    const map = new Map<string, number>([
      ['Alta', 0],
      ['Média', 0],
      ['Baixa', 0],
      ['Sem prioridade', 0],
    ])

    rows.forEach((item) => {
      const prioridadeAtual = item.prioridade || 'Sem prioridade'
      map.set(prioridadeAtual, (map.get(prioridadeAtual) || 0) + 1)
    })

    return Array.from(map.entries())
      .map(([prioridade, totalPrioridade]) => ({ prioridade, total: totalPrioridade }))
      .filter((item) => item.total > 0)
  }, [rows])

  const graficoMensal = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('pt-PT', {
      month: 'short',
      year: '2-digit',
    })

    const agora = new Date()
    const mesesBase: MonthlySummary[] = []

    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const mes = formatter.format(d).replace('.', '')
      mesesBase.push({ chave, mes, total: 0, abertas: 0, concluidas: 0 })
    }

    rows.forEach((item) => {
      if (!item.data_reporte) return

      const data = parseDateSafe(item.data_reporte)
      if (!data) return

      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
      const target = mesesBase.find((m) => m.chave === chave)
      if (!target) return

      target.total += 1

      if (isOpenEstado(item.estado)) {
        target.abertas += 1
      }

      if (item.estado === 'Concluída' || item.estado === 'Encerrada') {
        target.concluidas += 1
      }
    })

    return mesesBase
  }, [rows])

  const mediaResolucaoPorUnidade = useMemo(() => {
    const map = new Map<string, { soma: number; count: number }>()

    rows.forEach((item) => {
      if (item.estado !== 'Concluída' && item.estado !== 'Encerrada') return

      const dias = calcResolutionDays(item)
      if (dias == null) return

      const unidade = getUnitName(item.units, item.local_ocorrencia)

      if (!map.has(unidade)) {
        map.set(unidade, { soma: 0, count: 0 })
      }

      const current = map.get(unidade)!
      current.soma += dias
      current.count += 1
    })

    return Array.from(map.entries())
      .map(([unidade, value]) => ({
        unidade,
        mediaDias: Math.round((value.soma / value.count) * 10) / 10,
        totalResolvidas: value.count,
      }))
      .sort((a, b) => b.mediaDias - a.mediaDias)
  }, [rows])

  const graficoTempoMedio = useMemo(() => {
    return mediaResolucaoPorUnidade.slice(0, 10).map((item) => ({
      unidade: item.unidade,
      mediaDias: item.mediaDias,
    }))
  }, [mediaResolucaoPorUnidade])

  const topForaPrazo = useMemo(() => {
    return rows
      .filter((item) => getForaPrazoValue(item))
      .map((item) => ({
        id: item.id,
        ocorrencia: item.ocorrencia || '-',
        unidade: getUnitName(item.units, item.local_ocorrencia),
        categoria: normalizeCategoria(item.categoria),
        prioridade: item.prioridade || '-',
        estado: item.estado || '-',
        diasAtraso: calcDiasAtraso(item),
      }))
      .sort((a, b) => b.diasAtraso - a.diasAtraso)
      .slice(0, 10)
  }, [rows])

  const mediaResolucaoGlobal = useMemo(() => {
    const validos = rows
      .filter((item) => item.estado === 'Concluída' || item.estado === 'Encerrada')
      .map((item) => calcResolutionDays(item))
      .filter((value): value is number => value != null)

    if (validos.length === 0) return 0

    const soma = validos.reduce((acc, value) => acc + value, 0)
    return Math.round((soma / validos.length) * 10) / 10
  }, [rows])

  return (
    <div style={styles.page}>
      <DashboardTopbar
        title="Relatórios de gestão"
        subtitle="Visão global das ocorrências, prazos de resolução, tempos médios, satisfação e distribuição por unidade e categoria."
        userName={profile?.nome || undefined}
        userEmail={profile?.email || undefined}
        avatarUrl={avatarUrl}
        actions={[
          {
            label: 'Voltar ao dashboard',
            href: '/dashboard',
            variant: 'default',
          },
        ]}
      />

      {errorMessage && <div style={styles.error}>Erro ao carregar relatórios: {errorMessage}</div>}

      <div style={styles.statsGrid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Total de ocorrências</h3>
          <p style={styles.cardValue}>{total}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Ocorrências abertas</h3>
          <p style={styles.cardValue}>{totalAbertas}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Ocorrências concluídas</h3>
          <p style={styles.cardValue}>{totalConcluidas}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Fora do prazo</h3>
          <p style={styles.cardValue}>{totalForaPrazo}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Dentro do prazo</h3>
          <p style={styles.cardValue}>{totalDentroPrazo}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Tempo médio de resolução</h3>
          <p style={styles.cardValue}>{mediaResolucaoGlobal} dias</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Avaliações recebidas</h3>
          <p style={styles.cardValue}>{avaliacoes.length}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Média de satisfação</h3>
          <p style={styles.cardValue}>{mediaSatisfacao || 0}/5</p>
        </div>
      </div>

      {loading ? (
        <div style={styles.card}>A carregar...</div>
      ) : (
        <>
          <div style={styles.chartsGrid}>
            <HorizontalBars
              title="Ocorrências por unidade"
              items={graficoUnidades}
              labelKey="unidade"
              valueKey="total"
              color="#1d4ed8"
            />

            <HorizontalBars
              title="Top categorias"
              items={graficoCategorias}
              labelKey="categoria"
              valueKey="total"
              color="#7c3aed"
            />

            <DonutCard
              title="Estado global"
              valueA={totalAbertas}
              valueB={totalConcluidas}
              labelA="Abertas"
              labelB="Concluídas"
              colorA="#2563eb"
              colorB="#16a34a"
            />

            <DonutCard
              title="Prazo de resolução global"
              valueA={totalDentroPrazo}
              valueB={totalForaPrazo}
              labelA="Dentro do prazo"
              labelB="Fora do prazo"
              colorA="#16a34a"
              colorB="#dc2626"
            />

            <MonthlyEvolutionCard
              title="Evolução mensal"
              items={graficoMensal}
              color="#0f172a"
            />

            <HorizontalBars
              title="Distribuição por prioridade"
              items={graficoPrioridade}
              labelKey="prioridade"
              valueKey="total"
              color="#f59e0b"
            />

            <HorizontalBars
              title="Tempo médio por unidade (dias)"
              items={graficoTempoMedio}
              labelKey="unidade"
              valueKey="mediaDias"
              color="#0f766e"
            />

            <MonthlyOpenClosedCard
              title="Abertas vs concluídas por mês"
              items={graficoMensal}
            />
          </div>

          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Top ocorrências fora do prazo</h2>
              <div style={styles.sectionSubtitle}>
                Ocorrências com maior atraso face ao prazo definido.
              </div>
            </div>
          </div>

          <div style={styles.chartCard}>
            {topForaPrazo.length === 0 ? (
              <div style={styles.empty}>Sem ocorrências fora do prazo</div>
            ) : (
              <>
                {topForaPrazo.slice(0, 3).map((item) => (
                  <div key={item.id} style={styles.topAlert}>
                    <h3 style={styles.topAlertTitle}>
                      {item.ocorrencia} — {item.diasAtraso} dias de atraso
                    </h3>
                    <p style={styles.topAlertText}>
                      {item.unidade} | {item.categoria} | {item.prioridade} | {item.estado}
                    </p>
                  </div>
                ))}

                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Ocorrência</th>
                        <th style={styles.th}>Unidade</th>
                        <th style={styles.th}>Categoria</th>
                        <th style={styles.th}>Prioridade</th>
                        <th style={styles.th}>Estado</th>
                        <th style={styles.th}>Dias de atraso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topForaPrazo.map((item) => (
                        <tr key={item.id}>
                          <td style={styles.td}>{item.ocorrencia}</td>
                          <td style={styles.td}>{item.unidade}</td>
                          <td style={styles.td}>{item.categoria}</td>
                          <td style={styles.td}>{item.prioridade}</td>
                          <td style={styles.td}>{item.estado}</td>
                          <td style={styles.td}>{item.diasAtraso}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Resumo por unidade</h2>
              <div style={styles.sectionSubtitle}>
                Distribuição operacional agregada por unidade de saúde.
              </div>
            </div>

            <button style={styles.btn} onClick={() => exportUnitsCSV(resumoPorUnidade)}>
              Exportar unidades CSV
            </button>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Unidade</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Em aberto</th>
                  <th style={styles.th}>Em análise</th>
                  <th style={styles.th}>Em execução</th>
                  <th style={styles.th}>Concluídas</th>
                  <th style={styles.th}>Encerradas</th>
                  <th style={styles.th}>Fora do prazo</th>
                </tr>
              </thead>
              <tbody>
                {resumoPorUnidade.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={styles.empty}>
                      Sem dados
                    </td>
                  </tr>
                ) : (
                  resumoPorUnidade.map((item) => (
                    <tr key={item.unidade}>
                      <td style={styles.td}>{item.unidade}</td>
                      <td style={styles.td}>{item.total}</td>
                      <td style={styles.td}>{item.emAberto}</td>
                      <td style={styles.td}>{item.emAnalise}</td>
                      <td style={styles.td}>{item.emExecucao}</td>
                      <td style={styles.td}>{item.concluidas}</td>
                      <td style={styles.td}>{item.encerradas}</td>
                      <td style={styles.td}>{item.foraPrazo}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Resumo por categoria</h2>
              <div style={styles.sectionSubtitle}>
                Agrupamento das ocorrências por tipologia de intervenção.
              </div>
            </div>

            <button style={styles.btn} onClick={() => exportCategoriesCSV(resumoPorCategoria)}>
              Exportar categorias CSV
            </button>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Categoria</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Em aberto</th>
                  <th style={styles.th}>Em análise</th>
                  <th style={styles.th}>Em execução</th>
                  <th style={styles.th}>Concluídas</th>
                  <th style={styles.th}>Encerradas</th>
                  <th style={styles.th}>Fora do prazo</th>
                </tr>
              </thead>
              <tbody>
                {resumoPorCategoria.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={styles.empty}>
                      Sem dados
                    </td>
                  </tr>
                ) : (
                  resumoPorCategoria.map((item) => (
                    <tr key={item.categoria}>
                      <td style={styles.td}>{item.categoria}</td>
                      <td style={styles.td}>{item.total}</td>
                      <td style={styles.td}>{item.emAberto}</td>
                      <td style={styles.td}>{item.emAnalise}</td>
                      <td style={styles.td}>{item.emExecucao}</td>
                      <td style={styles.td}>{item.concluidas}</td>
                      <td style={styles.td}>{item.encerradas}</td>
                      <td style={styles.td}>{item.foraPrazo}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Tempo médio por unidade</h2>
              <div style={styles.sectionSubtitle}>
                Média de dias de resolução para ocorrências encerradas ou concluídas.
              </div>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Unidade</th>
                  <th style={styles.th}>Tempo médio (dias)</th>
                  <th style={styles.th}>Ocorrências resolvidas</th>
                </tr>
              </thead>
              <tbody>
                {mediaResolucaoPorUnidade.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={styles.empty}>
                      Sem dados de resolução
                    </td>
                  </tr>
                ) : (
                  mediaResolucaoPorUnidade.map((item) => (
                    <tr key={item.unidade}>
                      <td style={styles.td}>{item.unidade}</td>
                      <td style={styles.td}>{item.mediaDias}</td>
                      <td style={styles.td}>{item.totalResolvidas}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Avaliações recebidas</h2>
              <div style={styles.sectionSubtitle}>
                Comentários e pontuações submetidos pelos utilizadores.
              </div>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Ocorrência</th>
                  <th style={styles.th}>Unidade</th>
                  <th style={styles.th}>Pontuação</th>
                  <th style={styles.th}>Comentário</th>
                  <th style={styles.th}>Data</th>
                </tr>
              </thead>
              <tbody>
                {avaliacoes.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={styles.empty}>
                      Sem avaliações submetidas
                    </td>
                  </tr>
                ) : (
                  avaliacoes.map((item) => (
                    <tr key={item.id}>
                      <td style={styles.td}>{item.ocorrencia || '-'}</td>
                      <td style={styles.td}>{getUnitName(item.units, item.local_ocorrencia)}</td>
                      <td style={styles.td}>{item.satisfaction_score}/5</td>
                      <td style={styles.td}>{item.satisfaction_comment || '-'}</td>
                      <td style={styles.td}>
                        {formatDate(item.satisfaction_submitted_at || null)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
