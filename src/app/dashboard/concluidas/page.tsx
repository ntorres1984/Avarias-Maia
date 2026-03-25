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
  link.setAttribute('download', 'ocorrencias_concluidas.csv')
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
    minWidth: '220px',
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

  return { ...styles.badgeBase, backgroundColor: '#f1f5f9', color: '#475569' }
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

export default function ConcluidasPage() {
  const supabase = createClient()

  const [rows, setRows] = useState<Occurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [filtroUnidade, setFiltroUnidade] = useState('')

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
        units (
          nome
        )
      `)
      .in('estado', ['Concluída', 'Encerrada'])
      .order('data_encerramento', { ascending: false })
      .order('data_estado', { ascending: false })

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

  const unidades = useMemo(() => {
    const values = rows.map((item) => getUnitName(item.units, item.local_ocorrencia))
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const listaFiltrada = useMemo(() => {
    return rows.filter((item) => {
      const unidade = getUnitName(item.units, item.local_ocorrencia)
      return !filtroUnidade || unidade === filtroUnidade
    })
  }, [rows, filtroUnidade])

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Ocorrências concluídas</h1>
          <div style={{ marginTop: 8 }}>
            <Link href="/dashboard" style={styles.subLink}>
              ← Voltar ao dashboard
            </Link>
          </div>
        </div>

        <button style={styles.btn} onClick={() => exportToCSV(listaFiltrada)}>
          Exportar CSV
        </button>
      </div>

      {errorMessage && (
        <div style={styles.error}>
          Erro ao carregar: {errorMessage}
        </div>
      )}

      <div style={styles.filtersBox}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Filtrar por unidade</label>
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

        <div>
          <button style={styles.btn} onClick={() => setFiltroUnidade('')}>
            Limpar filtro
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ ...styles.tableWrapper, padding: 20 }}>A carregar...</div>
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
                <th style={styles.th}>Data reporte</th>
                <th style={styles.th}>Data alteração estado</th>
                <th style={styles.th}>Data fim</th>
                <th style={styles.th}>Observações</th>
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={10} style={styles.empty}>
                    Sem ocorrências concluídas
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((item) => (
                  <tr key={item.id}>
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
                    <td style={styles.td}>{formatDate(item.data_reporte)}</td>
                    <td style={styles.td}>{formatDateTime(item.data_estado)}</td>
                    <td style={styles.td}>{formatDateTime(item.data_encerramento)}</td>
                    <td style={{ ...styles.td, ...styles.obsCell }}>
                      {item.observacoes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
