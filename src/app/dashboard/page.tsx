'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardTopbar from '@/components/dashboard/DashboardTopbar'

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
  created_by: string | null
  foto_url: string | null
  units: UnitRelation
}

type Profile = {
  id: string
  role: string | null
  nome: string | null
  email: string | null
  ativo?: boolean | null
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

function getForaPrazoValue(item: Occurrence) {
  return item.fora_sla === true
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
    'Unidade',
    'Categoria',
    'Prioridade',
    'Impacto',
    'Estado',
    'Data reporte',
    'Data alteração estado',
    'Data fim',
    'Prazo de resolução (dias)',
    'Fora do prazo',
    'Observações',
    'Foto',
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
    getForaPrazoValue(item) ? 'Sim' : 'Não',
    item.observacoes || '',
    item.foto_url || '',
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

  deleteBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '8px',
    border: 'none',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  } as const,

  rowActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },

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
    borderRadius: '18px',
    padding: '22px',
    marginBottom: '20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
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
    minWidth: '1320px',
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

  photoWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '84px',
  } as const,

  photoThumb: {
    width: '72px',
    height: '72px',
    objectFit: 'cover' as const,
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
  } as const,

  photoEmpty: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '72px',
    height: '72px',
    borderRadius: '10px',
    border: '1px dashed #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#94a3b8',
    fontSize: '12px',
    textAlign: 'center' as const,
    padding: '6px',
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

function getPrazoBadgeStyle(foraPrazo: boolean) {
  if (foraPrazo) {
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
  const router = useRouter()

  const [rows, setRows] = useState<Occurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [role, setRole] = useState<string>('user')
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})

  const [filtroUnidade, setFiltroUnidade] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [search, setSearch] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const canExport = role === 'admin' || role === 'gestor'
  const canSeeReports = role === 'admin' || role === 'gestor' || role === 'tecnico'
  const canManageUsers = role === 'admin' || role === 'gestor'
  const canDelete = role === 'admin' || role === 'gestor'

  async function loadPhotoUrls(items: Occurrence[]) {
    const withPhoto = items.filter((item) => item.foto_url)

    if (withPhoto.length === 0) {
      setPhotoUrls({})
      return
    }

    const signedUrlMap: Record<string, string> = {}

    await Promise.all(
      withPhoto.map(async (item) => {
        const path = item.foto_url
        if (!path) return

        const { data, error } = await supabase.storage
          .from('ocorrencias')
          .createSignedUrl(path, 3600)

        if (!error && data?.signedUrl) {
          signedUrlMap[item.id] = data.signedUrl
        }
      })
    )

    setPhotoUrls(signedUrlMap)
  }

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
      .select('id, role, nome, email, ativo')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Erro a carregar perfil:', profileError)
    }

    const currentProfile = (profileData || null) as Profile | null
    setProfile(currentProfile)
    setRole(currentProfile?.role || 'user')

    if (currentProfile?.ativo === false) {
      await supabase.auth.signOut()
      router.replace('/login')
      return
    }

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
        created_by,
        foto_url,
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

    const items = (data || []) as Occurrence[]
    setRows(items)
    await loadPhotoUrls(items)
    setLoading(false)
  }

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.replace('/login')
  }

  async function handleDelete(id: string) {
    if (!canDelete) return

    const confirmDelete = window.confirm(
      'Tens a certeza que queres apagar esta ocorrência? Esta ação não pode ser anulada.'
    )

    if (!confirmDelete) return

    setDeletingId(id)

    const { error } = await supabase.from('occurrences').delete().eq('id', id)

    if (error) {
      setErrorMessage(`Erro ao apagar ocorrência: ${error.message}`)
      setDeletingId(null)
      return
    }

    await loadOccurrences()
    setDeletingId(null)
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

  const foraPrazo = rows.filter((o) => getForaPrazoValue(o)).length

  const percentagemForaPrazo =
    total > 0 ? Math.round((foraPrazo / total) * 100) : 0

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

    const resolvidasValidas = resolvidas.filter((o) => {
      const inicio = new Date(o.data_reporte as string).getTime()
      const fim = new Date(o.data_encerramento as string).getTime()
      return !Number.isNaN(inicio) && !Number.isNaN(fim)
    })

    if (resolvidasValidas.length === 0) return 0

    const totalMs = resolvidasValidas.reduce((acc, o) => {
      const inicio = new Date(o.data_reporte as string).getTime()
      const fim = new Date(o.data_encerramento as string).getTime()
      return acc + (fim - inicio)
    }, 0)

    return Math.round(totalMs / resolvidasValidas.length / (1000 * 60 * 60 * 24))
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

      const textoPesquisa = [
        item.ocorrencia || '',
        unidade,
        item.categoria || '',
        item.prioridade || '',
        item.impacto || '',
        item.estado || '',
        item.observacoes || '',
      ]
        .join(' ')
        .toLowerCase()

      const matchSearch =
        !search.trim() || textoPesquisa.includes(search.trim().toLowerCase())

      const dataItem = item.data_reporte ? new Date(item.data_reporte) : null
      const dataItemTime =
        dataItem && !Number.isNaN(dataItem.getTime()) ? dataItem.getTime() : null

      const inicioTime = dataInicio
        ? new Date(`${dataInicio}T00:00:00`).getTime()
        : null

      const fimTime = dataFim
        ? new Date(`${dataFim}T23:59:59`).getTime()
        : null

      const matchDataInicio =
        !inicioTime || (dataItemTime !== null && dataItemTime >= inicioTime)

      const matchDataFim =
        !fimTime || (dataItemTime !== null && dataItemTime <= fimTime)

      return (
        matchUnidade &&
        matchCategoria &&
        matchEstado &&
        matchSearch &&
        matchDataInicio &&
        matchDataFim
      )
    })
  }, [
    listaDashboard,
    filtroUnidade,
    filtroCategoria,
    filtroEstado,
    search,
    dataInicio,
    dataFim,
  ])

  const topbarActions = [
    ...(canExport
      ? [
          {
            label: 'Exportar CSV',
            onClick: () => exportToCSV(rows),
            variant: 'default' as const,
          },
        ]
      : []),
    ...(canSeeReports
      ? [
          {
            label: 'Relatórios',
            href: '/dashboard/relatorios',
            variant: 'blue' as const,
          },
        ]
      : []),
    {
      label: 'Ver concluídas',
      href: '/dashboard/concluidas',
      variant: 'gray' as const,
    },
    ...(canManageUsers
      ? [
          {
            label: 'Utilizadores',
            href: '/dashboard/utilizadores',
            variant: 'green' as const,
          },
        ]
      : []),
    {
      label: 'Nova Ocorrência',
      href: '/dashboard/nova-ocorrencia',
      variant: 'primary' as const,
    },
    {
      label: loggingOut ? 'A sair...' : 'Logout',
      onClick: handleLogout,
      variant: 'red' as const,
      disabled: loggingOut,
    },
  ]

  return (
    <div style={styles.page}>
      <DashboardTopbar
        title="Dashboard"
        subtitle={`${profile?.nome || profile?.email || 'Utilizador'} • ${getRoleLabel(role)}`}
        actions={topbarActions}
      />

      {errorMessage && <div style={styles.error}>{errorMessage}</div>}

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
          <h3 style={styles.cardTitle}>Fora do prazo</h3>
          <p style={styles.cardValue}>{foraPrazo}</p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>% Fora do prazo</h3>
          <p style={styles.cardValue}>{percentagemForaPrazo}%</p>
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
          <label style={styles.label}>Pesquisar</label>
          <input
            type="text"
            style={styles.select}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar ocorrência, unidade, observações..."
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Data início</label>
          <input
            type="date"
            style={styles.select}
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Data fim</label>
          <input
            type="date"
            style={styles.select}
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>

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

        <div style={styles.filterButtonWrap}>
          <button
            style={styles.btn}
            onClick={() => {
              setFiltroUnidade('')
              setFiltroCategoria('')
              setFiltroEstado('')
              setSearch('')
              setDataInicio('')
              setDataFim('')
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
                <th style={styles.th}>Foto</th>
                <th style={styles.th}>Ocorrência</th>
                <th style={styles.th}>Unidade</th>
                <th style={styles.th}>Categoria</th>
                <th style={styles.th}>Prioridade</th>
                <th style={styles.th}>Impacto</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Prazo de resolução</th>
                <th style={styles.th}>Data reporte</th>
                <th style={styles.th}>Observações</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={11} style={styles.empty}>
                    Sem ocorrências em aberto para os filtros escolhidos
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((item) => {
                  const foraPrazoAtual = getForaPrazoValue(item)
                  const photoUrl = photoUrls[item.id]

                  return (
                    <tr
                      key={item.id}
                      style={foraPrazoAtual ? { backgroundColor: '#fef2f2' } : undefined}
                    >
                      <td style={styles.td}>
                        <div style={styles.photoWrap}>
                          {photoUrl ? (
                            <a href={photoUrl} target="_blank" rel="noreferrer">
                              <img
                                src={photoUrl}
                                alt={item.ocorrencia || 'Fotografia da ocorrência'}
                                style={styles.photoThumb}
                              />
                            </a>
                          ) : (
                            <div style={styles.photoEmpty}>Sem foto</div>
                          )}
                        </div>
                      </td>

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
                          <span>{item.sla_dias == null ? '-' : `${item.sla_dias} dias`}</span>
                          <span style={getPrazoBadgeStyle(foraPrazoAtual)}>
                            {foraPrazoAtual ? 'Fora do prazo' : 'Dentro do prazo'}
                          </span>
                        </div>
                      </td>

                      <td style={styles.td}>{formatDate(item.data_reporte)}</td>

                      <td style={{ ...styles.td, ...styles.obsCell }}>
                        {item.observacoes || '-'}
                      </td>

                      <td style={styles.td}>
                        <div style={styles.rowActions}>
                          <Link
                            href={`/dashboard/ocorrencia/${item.id}`}
                            style={styles.editBtn}
                          >
                            Editar
                          </Link>

                          {canDelete && (
                            <button
                              type="button"
                              style={styles.deleteBtn}
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                            >
                              {deletingId === item.id ? 'A apagar...' : 'Apagar'}
                            </button>
                          )}
                        </div>
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
