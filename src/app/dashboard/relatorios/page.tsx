'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  units: UnitRelation
}

type UnitSummary = {
  unidade: string
  total: number
  emAberto: number
  emAnalise: number
  emExecucao: number
  concluidas: number
  encerradas: number
  foraSla: number
}

type CategorySummary = {
  categoria: string
  total: number
  emAberto: number
  emAnalise: number
  emExecucao: number
  concluidas: number
  encerradas: number
  foraSla: number
}

type MonthlySummary = {
  mes: string
  chave: string
  total: number
  abertas: number
  concluidas: number
}

type AvgResolutionByUnit = {
  unidade: string
  mediaDias: number
  totalResolvidas: number
}

type TopForaSlaItem = {
  id: string
  ocorrencia: string
  unidade: string
  categoria: string
  prioridade: string
  estado: string
  diasAtraso: number
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

function getForaSlaValue(item: Occurrence) {
  return item.fora_sla === true
}

function percent(value: number, total: number) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-PT')
}

function calcResolutionDays(item: Occurrence) {
  if (!item.data_reporte || !item.data_encerramento) return null

  const inicio = new Date(item.data_reporte).getTime()
  const fim = new Date(item.data_encerramento).getTime()

  if (Number.isNaN(inicio) || Number.isNaN(fim) || fim < inicio) return null

  return (fim - inicio) / (1000 * 60 * 60 * 24)
}

function calcDiasAtraso(item: Occurrence) {
  if (!item.data_reporte || item.sla_dias == null) return 0

  const inicio = new Date(item.data_reporte).getTime()
  if (Number.isNaN(inicio)) return 0

  const prazoMs = item.sla_dias * 24 * 60 * 60 * 1000
  const limite = inicio + prazoMs

  const referencia =
    item.estado === 'Concluída' || item.estado === 'Encerrada'
      ? item.data_encerramento
        ? new Date(item.data_encerramento).getTime()
        : Date.now()
      : Date.now()

  if (Number.isNaN(referencia)) return 0

  const atrasoMs = referencia - limite
  if (atrasoMs <= 0) return 0

  return Math.round(atrasoMs / (1000 * 60 * 60 * 24))
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
    'Fora SLA',
  ]

  const rows = lista.map((item) => [
    item.unidade,
    item.total,
    item.emAberto,
    item.emAnalise,
    item.emExecucao,
    item.concluidas,
    item.encerradas,
    item.foraSla,
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
    'Fora SLA',
  ]

  const rows = lista.map((item) => [
    item.categoria,
    item.total,
    item.emAberto,
    item.emAnalise,
    item.emExecucao,
    item.concluidas,
    item.encerradas,
    item.foraSla,
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

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    gap: '16px',
    flexWrap: 'wrap',
  } as const,

  title: {
    margin: 0,
    fontSize: '40px',
    fontWeight: 700,
  } as const,

  subLink: {
    color: '#475569',
    textDecoration: 'none',
    fontWeight: 600,
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
    flexWrap: 'wrap',
  } as const,

  sectionTitle: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
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
  const maxValue = Math.max(
    ...items.flatMap((item) => [item.abertas, item.concluidas]),
    0
  )

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
              const heightB =
                maxValue > 0 ? `${(item.concluidas / maxValue) * 100}%` : '0%'

              return (
                <div key={item.chave} style={styles.monthlyColumn}>
                  <div style={styles.monthlyValue}>
                    {item.abertas + item.concluidas}
                  </div>

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

  const [rows, setRows] = useState<Occurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  async function loadOccurrences() {
    setLoading(true)
    setErrorMessage('')

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
        fora_sla,
        sla_dias,
        units (
          nome
        )
      `)
      .order('data_reporte', { ascending: false })

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
    loadOccurrences()
  }, [])

  const resumoPorUnidade = useMemo(() => {
    const map = new Map<string, UnitSummary>()

    rows.forEach((item) => {
      const unidade = getUnitName(item.units, item.local_ocorrencia)
      const estado = item.estado || '-'
      const foraSlaAtual = getForaSlaValue(item)

      if (!map.has(unidade)) {
        map.set(unidade, {
          unidade,
          total: 0,
          emAberto: 0,
          emAnalise: 0,
          emExecucao: 0,
          concluidas: 0,
          encerradas: 0,
          foraSla: 0,
        })
      }

      const current = map.get(unidade)!

      current.total += 1

      if (estado === 'Em aberto') current.emAberto += 1
      if (estado === 'Em análise') current.emAnalise += 1
      if (estado === 'Em execução') current.emExecucao += 1
      if (estado === 'Concluída') current.concluidas += 1
      if (estado === 'Encerrada') current.encerradas += 1
      if (foraSlaAtual) current.foraSla += 1
    })

    return Array.from(map.values()).sort((a, b) =>
      a.unidade.localeCompare(b.unidade)
    )
  }, [rows])

  const resumoPorCategoria = useMemo(() => {
    const map = new Map<string, CategorySummary>()

    rows.forEach((item) => {
      const categoria = normalizeCategoria(item.categoria)
      const estado = item.estado || '-'
      const foraSlaAtual = getForaSlaValue(item)

      if (!map.has(categoria)) {
        map.set(categoria, {
          categoria,
          total: 0,
          emAberto: 0,
          emAnalise: 0,
          emExecucao: 0,
          concluidas: 0,
          encerradas: 0,
          foraSla: 0,
        })
      }

      const current = map.get(categoria)!

      current.total += 1

      if (estado === 'Em aberto') current.emAberto += 1
      if (estado === 'Em análise') current.emAnalise += 1
      if (estado === 'Em execução') current.emExecucao += 1
      if (estado === 'Concluída') current.concluidas += 1
      if (estado === 'Encerrada') current.encerradas += 1
      if (foraSlaAtual) current.foraSla += 1
    })

    return Array.from(map.values()).sort((a, b) =>
      a.categoria.localeCompare(b.categoria)
    )
  }, [rows])

  const total = rows.length

  const totalConcluidas = rows.filter(
    (o) => o.estado === 'Concluída' || o.estado === 'Encerrada'
  ).length

  const totalAbertas = rows.filter(
    (o) =>
      o.estado === 'Em aberto' ||
      o.estado === 'Em análise' ||
      o.estado === 'Em execução'
  ).length

  const totalForaSla = rows.filter((o) => getForaSlaValue(o)).length
  const totalDentroSla = total - totalForaSla

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
      const prioridade = item.prioridade || 'Sem prioridade'
      map.set(prioridade, (map.get(prioridade) || 0) + 1)
    })

    return Array.from(map.entries())
      .map(([prioridade, total]) => ({ prioridade, total }))
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

      const data = new Date(item.data_reporte)
      if (Number.isNaN(data.getTime())) return

      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
      const target = mesesBase.find((m) => m.chave === chave)
      if (!target) return

      target.total += 1

      if (
        item.estado === 'Em aberto' ||
        item.estado === 'Em análise' ||
        item.estado === 'Em execução'
      ) {
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

  const topForaSla = useMemo(() => {
    return rows
      .filter((item) => getForaSlaValue(item))
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
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Relatórios de gestão</h1>
          <div style={{ marginTop: 8 }}>
            <Link href="/dashboard" style={styles.subLink}>
              ← Voltar ao dashboard
            </Link>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div style={styles.error}>
          Erro ao carregar relatórios: {errorMessage}
        </div>
      )}

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
          <h3 style={styles.cardTitle}>Fora SLA</h3>
          <p style={styles.cardValue}>{totalForaSla}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Dentro SLA</h3>
          <p style={styles.cardValue}>{totalDentroSla}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Tempo médio resolução</h3>
          <p style={styles.cardValue}>{mediaResolucaoGlobal} dias</p>
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
              title="SLA global"
              valueA={totalDentroSla}
              valueB={totalForaSla}
              labelA="Dentro SLA"
              labelB="Fora SLA"
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
            <h2 style={styles.sectionTitle}>Top ocorrências fora SLA</h2>
          </div>

          <div style={styles.chartCard}>
            {topForaSla.length === 0 ? (
              <div style={styles.empty}>Sem ocorrências fora SLA</div>
            ) : (
              <>
                {topForaSla.slice(0, 3).map((item) => (
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
                      {topForaSla.map((item) => (
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
            <h2 style={styles.sectionTitle}>Resumo por unidade</h2>
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
                  <th style={styles.th}>Fora SLA</th>
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
                      <td style={styles.td}>{item.foraSla}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Resumo por categoria</h2>
            <button
              style={styles.btn}
              onClick={() => exportCategoriesCSV(resumoPorCategoria)}
            >
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
                  <th style={styles.th}>Fora SLA</th>
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
                      <td style={styles.td}>{item.foraSla}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Tempo médio por unidade</h2>
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
            <h2 style={styles.sectionTitle}>Últimas ocorrências fora SLA</h2>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Ocorrência</th>
                  <th style={styles.th}>Unidade</th>
                  <th style={styles.th}>Categoria</th>
                  <th style={styles.th}>Prioridade</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Data reporte</th>
                  <th style={styles.th}>Dias de atraso</th>
                </tr>
              </thead>
              <tbody>
                {topForaSla.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={styles.empty}>
                      Sem dados
                    </td>
                  </tr>
                ) : (
                  topForaSla.map((item) => {
                    const original = rows.find((row) => row.id === item.id)

                    return (
                      <tr key={item.id}>
                        <td style={styles.td}>{item.ocorrencia}</td>
                        <td style={styles.td}>{item.unidade}</td>
                        <td style={styles.td}>{item.categoria}</td>
                        <td style={styles.td}>{item.prioridade}</td>
                        <td style={styles.td}>{item.estado}</td>
                        <td style={styles.td}>
                          {formatDate(original?.data_reporte || null)}
                        </td>
                        <td style={styles.td}>{item.diasAtraso}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
