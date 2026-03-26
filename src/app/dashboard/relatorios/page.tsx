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

function getUnitName(units: UnitRelation, fallback: string | null) {
  if (Array.isArray(units)) {
    return units[0]?.nome || fallback || '-'
  }
  return units?.nome || fallback || '-'
}

function normalizeCategoria(value: string | null) {
  return value || 'Sem categoria'
}

function isForaSLA(item: Occurrence) {
  if (!item.data_reporte || !item.sla_dias) return false

  if (item.estado === 'Concluída' || item.estado === 'Encerrada') {
    return false
  }

  const inicio = new Date(item.data_reporte).getTime()
  if (Number.isNaN(inicio)) return false

  const agora = Date.now()
  const diasPassados = (agora - inicio) / (1000 * 60 * 60 * 24)

  return diasPassados > item.sla_dias
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
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')
    )
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
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')
    )
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
      const foraSlaAtual = isForaSLA(item)

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
      const foraSlaAtual = isForaSLA(item)

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
  const totalForaSla = rows.filter((o) => isForaSLA(o)).length

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
      </div>

      {loading ? (
        <div style={styles.card}>A carregar...</div>
      ) : (
        <>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Resumo por unidade</h2>
            <button
              style={styles.btn}
              onClick={() => exportUnitsCSV(resumoPorUnidade)}
            >
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
        </>
      )}
    </div>
  )
}
