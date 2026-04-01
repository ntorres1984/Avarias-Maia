'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardTopbar from '@/components/dashboard/DashboardTopbar'

type Occurrence = {
  id: string
  ocorrencia: string | null
  categoria: string | null
  prioridade: string | null
  estado: string | null
  data_reporte: string | null
  data_encerramento: string | null
  fora_sla: boolean | null
  created_by: string | null
}

type Profile = {
  id: string
  nome: string | null
  email: string | null
  role: string | null
  ativo?: boolean | null
}

function formatDate(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-PT')
}

function getRoleLabel(role: string | null) {
  if (role === 'admin') return 'Administrador'
  if (role === 'gestor') return 'Gestor'
  if (role === 'tecnico') return 'Técnico'
  return 'Utilizador'
}

function exportToCSV(lista: Occurrence[]) {
  const headers = [
    'Ocorrência',
    'Categoria',
    'Estado',
    'Prioridade',
    'Data reporte',
    'Data encerramento',
    'Fora SLA',
  ]

  const rows = lista.map((item) => [
    item.ocorrencia || '',
    item.categoria || '',
    item.estado || '',
    item.prioridade || '',
    formatDate(item.data_reporte),
    formatDate(item.data_encerramento),
    item.fora_sla ? 'Sim' : 'Não',
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
  link.setAttribute('download', 'relatorios_ocorrencias.csv')
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

  error: {
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
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

  filtersBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    padding: '22px',
    marginBottom: '20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '18px',
    alignItems: 'end',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  } as const,

  filterGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    minWidth: 0,
  } as const,

  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 700,
    color: '#334155',
    paddingLeft: '2px',
  } as const,

  select: {
    width: '100%',
    minHeight: '46px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    padding: '10px 14px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  } as const,

  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    textDecoration: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
    minHeight: '46px',
  } as const,

  filterButtonWrap: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
    flexWrap: 'wrap' as const,
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
    minWidth: '900px',
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

export default function RelatoriosPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [role, setRole] = useState<string>('user')
  const [rows, setRows] = useState<Occurrence[]>([])

  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')

  const canExport = role === 'admin' || role === 'gestor'

  async function loadData() {
    setLoading(true)
    setErrorMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      router.replace('/login')
      return
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, nome, email, role, ativo')
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

    if (currentProfile?.ativo === false) {
      await supabase.auth.signOut()
      router.replace('/login')
      return
    }

    if (!['admin', 'gestor', 'tecnico'].includes(currentProfile?.role || 'user')) {
      router.replace('/dashboard')
      return
    }

    const { data, error } = await supabase
      .from('occurrences')
      .select(`
        id,
        ocorrencia,
        categoria,
        prioridade,
        estado,
        data_reporte,
        data_encerramento,
        fora_sla,
        created_by
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
    loadData()
  }, [])

  const categorias = useMemo(() => {
    const values = rows.map((item) => item.categoria || 'Sem categoria')
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const estados = useMemo(() => {
    const values = rows.map((item) => item.estado || '-')
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const listaFiltrada = useMemo(() => {
    return rows.filter((item) => {
      const matchEstado = !filtroEstado || (item.estado || '-') === filtroEstado
      const matchCategoria =
        !filtroCategoria || (item.categoria || 'Sem categoria') === filtroCategoria

      return matchEstado && matchCategoria
    })
  }, [rows, filtroEstado, filtroCategoria])

  const total = listaFiltrada.length
  const abertas = listaFiltrada.filter(
    (item) => item.estado !== 'Concluída' && item.estado !== 'Encerrada'
  ).length
  const fechadas = listaFiltrada.filter(
    (item) => item.estado === 'Concluída' || item.estado === 'Encerrada'
  ).length
  const foraSla = listaFiltrada.filter((item) => item.fora_sla === true).length

  const topbarActions = [
    {
      label: 'Voltar ao dashboard',
      href: '/dashboard',
      variant: 'gray' as const,
    },
    ...(canExport
      ? [
          {
            label: 'Exportar CSV',
            onClick: () => exportToCSV(listaFiltrada),
            variant: 'green' as const,
          },
        ]
      : []),
  ]

  return (
    <div style={styles.page}>
      <DashboardTopbar
        title="Relatórios"
        subtitle={`${profile?.nome || profile?.email || 'Utilizador'} • ${getRoleLabel(role)}`}
        actions={topbarActions}
      />

      {errorMessage && <div style={styles.error}>{errorMessage}</div>}

      <div style={styles.filtersBox}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Estado</label>
          <select
            style={styles.select}
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos os estados</option>
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
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
            <option value="">Todas as categorias</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterButtonWrap}>
          <button
            style={styles.btn}
            onClick={() => {
              setFiltroEstado('')
              setFiltroCategoria('')
            }}
          >
            Limpar filtros
          </button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Total</h3>
          <p style={styles.cardValue}>{total}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Abertas</h3>
          <p style={styles.cardValue}>{abertas}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Fechadas</h3>
          <p style={styles.cardValue}>{fechadas}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Fora SLA</h3>
          <p style={styles.cardValue}>{foraSla}</p>
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
                <th style={styles.th}>Categoria</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Prioridade</th>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>SLA</th>
              </tr>
            </thead>

            <tbody>
              {listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={6} style={styles.empty}>
                    Sem resultados para os filtros escolhidos
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.ocorrencia || '-'}</td>
                    <td style={styles.td}>{item.categoria || 'Sem categoria'}</td>
                    <td style={styles.td}>
                      <span style={getEstadoBadgeStyle(item.estado)}>
                        {item.estado || '-'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={getPrioridadeBadgeStyle(item.prioridade)}>
                        {item.prioridade || '-'}
                      </span>
                    </td>
                    <td style={styles.td}>{formatDate(item.data_reporte)}</td>
                    <td style={styles.td}>{item.fora_sla ? 'Fora SLA' : 'OK'}</td>
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
