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

function getUnitName(units: UnitRelation, fallback: string | null) {
  if (Array.isArray(units)) {
    return units[0]?.nome || fallback || '-'
  }
  return units?.nome || fallback || '-'
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

function exportToCSV(lista: Occurrence[]) {
  const headers = [
    'Ocorrência',
    'Unidade',
    'Categoria',
    'Prioridade',
    'Impacto',
    'Estado',
    'Data reporte',
    'Data alteração estado',
    'Data fim',
    'SLA dias',
    'Fora SLA',
    'Observações',
  ]

  const rows = lista.map((item) => [
    item.ocorrencia || '',
    getUnitName(item.units, item.local_ocorrencia),
    item.categoria || '',
    item.prioridade || '',
    item.impacto || '',
    item.estado || '',
    formatDate(item.data_reporte),
    formatDateTime(item.data_estado),
    formatDateTime(item.data_encerramento),
    item.sla_dias ?? '',
    isForaSLA(item) ? 'Sim' : 'Não',
    item.observacoes || '',
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
  link.setAttribute('download', 'ocorrencias_dashboard.csv')
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

  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
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
  } as const,

  btnBlue: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #1d4ed8',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
  } as const,

  btnGray: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #475569',
    backgroundColor: '#475569',
    color: '#ffffff',
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

  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '30px',
    fontWeight: 700,
  } as const,

  filtersBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '18px',
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  } as const,

  filterGroup: {
    minWidth: '180px',
  } as const,

  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#334155',
  } as const,

  select: {
    width: '100%',
    minHeight: '40px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
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
    minWidth: '1200px',
  },

  th: {
    borderBottom: '1px solid #e2e8f0',
    padding: '14px 12px',
    textAlign: 'left' as const,
    backgroundColor: '#f8fafc',
    fontSize: '14px',
    fontWeight: 700,
    color: '#334155',
    whiteSpace: 'nowrap' as const,
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

  badgeBase: {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    whiteSpace: 'nowrap' as const,
  },

  obsCell: {
    maxWidth: '280px',
    whiteSpace: 'normal' as const,
    wordBreak: 'break-word' as const,
  },

  editBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '13px',
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

function getEstadoBadgeStyle(estado: string | null) {
  if (estado === 'Concluída') {
    return { ...styles.badgeBase, backgroundColor: '#dcfce7', color: '#166534' }
  }

  if (estado === 'Encerrada') {
    return { ...styles.badgeBase, backgroundColor: '#e2e8f0', color: '#334155' }
  }

  if (estado === 'Em execução') {
    return { ...styles.badgeBase, backgroundColor: '#dbeafe', color: '#1d4ed8' }
  }

  if (estado === 'Em análise') {
    return { ...styles.badgeBase, backgroundColor: '#fef3c7', color: '#92400e' }
  }

  return { ...styles.badgeBase, backgroundColor: '#ede9fe', color: '#6d28d9' }
}

function getImpactoBadgeStyle(impacto: string | null) {
  if (impacto === 'Crítico') {
    return { ...styles.badgeBase, backgroundColor: '#fee2e2', color: '#b91c1c' }
  }

  if (impacto === 'Alto') {
    return { ...styles.badgeBase, backgroundColor: '#ffedd5', color: '#c2410c' }
  }

  if (impacto === 'Médio') {
    return { ...styles.badgeBase, backgroundColor: '#fef3c7', color: '#a16207' }
  }

  if (impacto === 'Baixo') {
    return { ...styles.badgeBase, backgroundColor: '#dcfce7', color: '#166534' }
  }

  return { ...styles.badgeBase, backgroundColor: '#f1f5f9', color: '#475569' }
}

function getPrioridadeBadgeStyle(prioridade: string | null) {
  if (prioridade === 'Alta') {
    return { ...styles.badgeBase, backgroundColor: '#fee2e2', color: '#b91c1c' }
  }

  if (prioridade === 'Média') {
    return { ...styles.badgeBase, backgroundColor: '#fef3c7', color: '#92400e' }
  }

  if (prioridade === 'Baixa') {
    return { ...styles.badgeBase, backgroundColor: '#dcfce7', color: '#166534' }
  }

  return { ...styles.badgeBase, backgroundColor: '#f1f5f9', color: '#475569' }
}

function getSlaBadgeStyle(foraSla: boolean) {
  if (foraSla) {
    return {
      ...styles.badgeBase,
      backgroundColor: '#dc2626',
      color: '#ffffff',
      fontWeight: 800,
    }
  }

  return {
    ...styles.badgeBase,
    backgroundColor: '#16a34a',
    color: '#ffffff',
  }
}

export default function DashboardPage() {
  const supabase = createClient()

  const [rows, setRows] = useState<Occurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [filtroUnidade, setFiltroUnidade] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [urlReady, setUrlReady] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setFiltroUnidade(params.get('unidade') || '')
    setFiltroCategoria(params.get('categoria') || '')
    setFiltroEstado(params.get('estado') || '')
    setUrlReady(true)
  }, [])

  useEffect(() => {
    if (!urlReady) return

    const params = new URLSearchParams()

    if (filtroUnidade) params.set('unidade', filtroUnidade)
    if (filtroCategoria) params.set('categoria', filtroCategoria)
    if (filtroEstado) params.set('estado', filtroEstado)

    const query = params.toString()
    const newUrl = query ? `/dashboard?${query}` : '/dashboard'
    window.history.replaceState({}, '', newUrl)
  }, [filtroUnidade, filtroCategoria, filtroEstado, urlReady])

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

  const total = rows.length

  const emAberto = rows.filter(
    (o) =>
      o.estado === 'Em aberto' ||
      o.estado === 'Em análise' ||
      o.estado === 'Em execução'
  ).length

  const concluidas = rows.filter(
    (o) => o.estado === 'Concluída' || o.estado === 'Encerrada'
  ).length

  const foraSla = rows.filter((o) => isForaSLA(o)).length

  const percentagemForaSla =
    total > 0 ? Math.round((foraSla / total) * 100) : 0

  const ocorrenciasCriticasAbertas = rows.filter(
    (o) =>
      (o.impacto === 'Crítico' || o.prioridade === 'Alta') &&
      o.estado !== 'Concluída' &&
      o.estado !== 'Encerrada'
  ).length

  const tempoMedioResolucao = (() => {
    const resolvidas = rows.filter(
      (o) =>
        o.data_reporte &&
        o.data_encerramento &&
        (o.estado === 'Concluída' || o.estado === 'Encerrada')
    )

    if (resolvidas.length === 0) return 0

    const totalMs = resolvidas.reduce((acc, o) => {
      const inicio = new Date(o.data_reporte as string).getTime()
      const fim = new Date(o.data_encerramento as string).getTime()
      return acc + (fim - inicio)
    }, 0)

    return Math.round(totalMs / resolvidas.length / (1000 * 60 * 60 * 24))
  })()

  const listaDashboard = rows.filter(
    (o) => o.estado !== 'Concluída' && o.estado !== 'Encerrada'
  )

  const unidades = useMemo(() => {
    const values = rows
      .map((item) => getUnitName(item.units, item.local_ocorrencia))
      .filter((value) => value && value !== '-')

    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const categorias = useMemo(() => {
    const values = rows.map((item) => item.categoria || 'Sem categoria')
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const estados = useMemo(() => {
    const values = listaDashboard.map((item) => item.estado || '-')
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
  }, [listaDashboard])

  const listaFiltrada = useMemo(() => {
    return listaDashboard.filter((item) => {
      const unidade = getUnitName(item.units, item.local_ocorrencia)
      const categoria = item.categoria || 'Sem categoria'
      const estado = item.estado || '-'

      const matchUnidade = !filtroUnidade || unidade === filtroUnidade
      const matchCategoria = !filtroCategoria || categoria === filtroCategoria
      const matchEstado = !filtroEstado || estado === filtroEstado

      return matchUnidade && matchCategoria && matchEstado
    })
  }, [listaDashboard, filtroUnidade, filtroCategoria, filtroEstado])

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>

        <div style={styles.actions}>
          <button style={styles.btn} onClick={() => exportToCSV(rows)}>
            Exportar CSV
          </button>

          <Link href="/dashboard/relatorios" style={styles.btnBlue}>
            Relatórios
          </Link>

          <Link href="/dashboard/concluidas" style={styles.btnGray}>
            Ver concluídas
          </Link>

          <Link href="/dashboard/nova-ocorrencia" style={styles.btnPrimary}>
            Nova Ocorrência
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div style={styles.error}>
          Erro ao carregar dashboard: {errorMessage}
        </div>
      )}

      <div style={styles.statsGrid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Total</h3>
          <p style={styles.cardValue}>{total}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Em aberto</h3>
          <p style={styles.cardValue}>{emAberto}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Concluídas</h3>
          <p style={styles.cardValue}>{concluidas}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Fora SLA</h3>
          <p style={styles.cardValue}>{foraSla}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>% Fora SLA</h3>
          <p style={styles.cardValue}>{percentagemForaSla}%</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Críticas em aberto</h3>
          <p style={styles.cardValue}>{ocorrenciasCriticasAbertas}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Tempo médio resolução</h3>
          <p style={styles.cardValue}>{tempoMedioResolucao} dias</p>
        </div>
      </div>

      <h2 style={styles.sectionTitle}>Ocorrências em aberto</h2>

      <div style={styles.filtersBox}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Unidade</label>
          <select
            style={styles.select}
            value={filtroUnidade}
            onChange={(e) => setFiltroUnidade(e.target.value)}
          >
            <option value="">Todas</option>
            {unidades.map((unidade) => (
              <option key={unidade} value={unidade}>
                {unidade}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Categoria</label>
          <select
            style={styles.select}
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="">Todas</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Estado</label>
          <select
            style={styles.select}
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos</option>
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            style={styles.btn}
            onClick={() => {
              setFiltroUnidade('')
              setFiltroCategoria('')
              setFiltroEstado('')
            }}
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.card}>A carregar...</div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Ocorrência</th>
                <th style={styles.th}>Unidade</th>
                <th style={styles.th}>Categoria</th>
                <th style={styles.th}>Prioridade</th>
                <th style={styles.th}>Impacto</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>SLA</th>
                <th style={styles.th}>Data reporte</th>
                <th style={styles.th}>Observações</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={10} style={styles.empty}>
                    Sem ocorrências em aberto para os filtros escolhidos
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((item) => {
                  const foraSlaAtual = isForaSLA(item)

                  return (
                    <tr
                      key={item.id}
                      style={foraSlaAtual ? { backgroundColor: '#fef2f2' } : undefined}
                    >
                      <td style={styles.td}>{item.ocorrencia || '-'}</td>

                      <td style={styles.td}>
                        {getUnitName(item.units, item.local_ocorrencia)}
                      </td>

                      <td style={styles.td}>{item.categoria || 'Sem categoria'}</td>

                      <td style={styles.td}>
                        <span style={getPrioridadeBadgeStyle(item.prioridade)}>
                          {item.prioridade || '-'}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={getImpactoBadgeStyle(item.impacto)}>
                          {item.impacto || '-'}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={getEstadoBadgeStyle(item.estado)}>
                          {item.estado || '-'}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span>{item.sla_dias ? `${item.sla_dias} dias` : '-'}</span>
                          <span style={getSlaBadgeStyle(foraSlaAtual)}>
                            {foraSlaAtual ? 'Fora SLA' : 'Dentro SLA'}
                          </span>
                        </div>
                      </td>

                      <td style={styles.td}>{formatDate(item.data_reporte)}</td>

                      <td style={{ ...styles.td, ...styles.obsCell }}>
                        {item.observacoes || '-'}
                      </td>

                      <td style={styles.td}>
                        <Link
                          href={`/dashboard/ocorrencia/${item.id}`}
                          style={styles.editBtn}
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
