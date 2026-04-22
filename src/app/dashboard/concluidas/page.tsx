'use client'

import Link from 'next/link'
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
  created_by: string | null
  assigned_gestor?: string | null
  assigned_tecnico?: string | null
  foto_url?: string | null
  units: UnitRelation
}

type Profile = {
  id: string
  role: string | null
  nome: string | null
  email: string | null
  ativo?: boolean | null
}

function parseDateSafe(dateString: string | null) {
  if (!dateString) return null

  const value = String(dateString).trim()
  if (!value) return null

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch
    return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0)
  }

  const localDateTimeMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/
  )

  if (localDateTimeMatch && !value.endsWith('Z')) {
    const [, y, m, d, hh, mm, ss] = localDateTimeMatch
    return new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      Number(ss || '0'),
      0
    )
  }

  const ptDateMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (ptDateMatch) {
    const [, d, m, y] = ptDateMatch
    return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0)
  }

  const fallback = new Date(value)
  if (!Number.isNaN(fallback.getTime())) return fallback

  return null
}

function formatDate(dateString: string | null) {
  const date = parseDateSafe(dateString)
  if (!date) return '-'

  return new Intl.DateTimeFormat('pt-PT', {
    timeZone: 'Europe/Lisbon',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatDateTime(dateString: string | null) {
  const date = parseDateSafe(dateString)
  if (!date) return '-'

  return new Intl.DateTimeFormat('pt-PT', {
    timeZone: 'Europe/Lisbon',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

function getUnitName(units: UnitRelation, fallback: string | null) {
  if (Array.isArray(units)) {
    return units[0]?.nome || fallback || '-'
  }
  return units?.nome || fallback || '-'
}

function getRoleLabel(role: string | null) {
  if (role === 'admin') return 'Administrador'
  if (role === 'gestor') return 'Gestor'
  if (role === 'tecnico') return 'Técnico'
  if (role === 'consulta') return 'Consulta'
  return 'Utilizador'
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

  return {
    backgroundColor: '#f1f5f9',
    color: '#475569',
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
  } as const,

  error: {
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
    fontSize: '14px',
  } as const,

  success: {
    color: '#166534',
    backgroundColor: '#dcfce7',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
    fontSize: '14px',
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

  input: {
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
    minWidth: '1300px',
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

  badge: {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    width: 'fit-content',
  } as const,

  obsCell: {
    maxWidth: '280px',
    whiteSpace: 'normal' as const,
    wordBreak: 'break-word' as const,
  },

  actionsCell: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    alignItems: 'flex-start',
  } as const,

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
    border: '1px solid #0f172a',
    cursor: 'pointer',
  } as const,

  deleteBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    color: '#b91c1c',
    padding: '8px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '13px',
    border: '1px solid #fecaca',
    cursor: 'pointer',
  } as const,

  deleteBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  } as const,

  imageThumb: {
    width: '74px',
    height: '74px',
    objectFit: 'cover' as const,
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    display: 'block',
  } as const,

  noImage: {
    width: '74px',
    height: '74px',
    borderRadius: '10px',
    border: '1px dashed #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    fontSize: '12px',
    backgroundColor: '#f8fafc',
  } as const,
}

export default function ConcluidasPage() {
  const supabase = createClient()
  const router = useRouter()

  const [rows, setRows] = useState<Occurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [role, setRole] = useState<string>('user')
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [filtroUnidade, setFiltroUnidade] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [search, setSearch] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  async function loadConcluidas() {
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
        created_by,
        assigned_gestor,
        assigned_tecnico,
        foto_url,
        units (
          nome
        )
      `)
      .in('estado', ['Concluída', 'Encerrada'])
      .order('data_encerramento', { ascending: false })

    const currentRole = currentProfile?.role || 'user'

    if (currentRole === 'gestor') {
      query = query.eq('assigned_gestor', user.id)
    } else if (currentRole === 'tecnico') {
      query = query.eq('assigned_tecnico', user.id)
    } else if (currentRole === 'user') {
      query = query.eq('created_by', user.id)
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

  async function loadVisiblePhotoUrls(items: Occurrence[]) {
    const itemsWithPhoto = items.filter((item) => item.foto_url)

    if (itemsWithPhoto.length === 0) {
      setPhotoUrls({})
      return
    }

    const nextMap: Record<string, string> = {}

    await Promise.all(
      itemsWithPhoto.map(async (item) => {
        const path = item.foto_url as string

        const { data, error } = await supabase.storage
          .from('ocorrencias')
          .createSignedUrl(path, 3600)

        if (!error && data?.signedUrl) {
          nextMap[item.id] = data.signedUrl
        }
      })
    )

    setPhotoUrls(nextMap)
  }

  async function handleDelete(item: Occurrence) {
    if (role !== 'admin') return

    const confirmed = window.confirm(
      `Tens a certeza que pretendes apagar definitivamente a ocorrência "${item.ocorrencia || '-'}"?`
    )

    if (!confirmed) return

    setDeletingId(item.id)
    setErrorMessage('')
    setSuccessMessage('')

    const { error: historyDeleteError } = await supabase
      .from('occurrence_history')
      .delete()
      .eq('occurrence_id', item.id)

    if (historyDeleteError) {
      setErrorMessage(`Falha ao apagar histórico: ${historyDeleteError.message}`)
      setDeletingId(null)
      return
    }

    const { error: occurrenceDeleteError } = await supabase
      .from('occurrences')
      .delete()
      .eq('id', item.id)

    if (occurrenceDeleteError) {
      setErrorMessage(`Falha ao apagar ocorrência: ${occurrenceDeleteError.message}`)
      setDeletingId(null)
      return
    }

    setSuccessMessage('Ocorrência apagada com sucesso.')
    setDeletingId(null)
    await loadConcluidas()
  }

  useEffect(() => {
    void loadConcluidas()
  }, [])

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
    const values = rows.map((item) => item.estado || '-')
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const listaFiltrada = useMemo(() => {
    return rows.filter((item) => {
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

      const dataItem = item.data_encerramento
        ? parseDateSafe(item.data_encerramento)
        : item.data_reporte
          ? parseDateSafe(item.data_reporte)
          : null

      const dataItemTime =
        dataItem && !Number.isNaN(dataItem.getTime()) ? dataItem.getTime() : null

      const inicioTime = dataInicio
        ? new Date(`${dataInicio}T00:00:00`).getTime()
        : null

      const fimTime = dataFim
        ? new Date(`${dataFim}T23:59:59`).getTime()
        : null

      const matchDataInicio =
        inicioTime == null || (dataItemTime !== null && dataItemTime >= inicioTime)

      const matchDataFim =
        fimTime == null || (dataItemTime !== null && dataItemTime <= fimTime)

      return (
        matchUnidade &&
        matchCategoria &&
        matchEstado &&
        matchSearch &&
        matchDataInicio &&
        matchDataFim
      )
    })
  }, [rows, filtroUnidade, filtroCategoria, filtroEstado, search, dataInicio, dataFim])

  useEffect(() => {
    void loadVisiblePhotoUrls(listaFiltrada)
  }, [listaFiltrada])

  return (
    <div style={styles.page}>
      <DashboardTopbar
        title="Ocorrências Concluídas"
        subtitle={`${profile?.nome || profile?.email || 'Utilizador'} • ${getRoleLabel(role)}`}
        actions={[{ label: 'Voltar ao dashboard', href: '/dashboard', variant: 'gray' }]}
      />

      {errorMessage && <div style={styles.error}>{errorMessage}</div>}
      {successMessage && <div style={styles.success}>{successMessage}</div>}

      <div style={styles.filtersBox}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Pesquisar</label>
          <input
            type="text"
            style={styles.input}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar ocorrência, unidade, observações..."
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Data início</label>
          <input
            type="date"
            style={styles.input}
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Data fim</label>
          <input
            type="date"
            style={styles.input}
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Unidade</label>
          <select
            style={styles.input}
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
            style={styles.input}
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
            style={styles.input}
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
            type="button"
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
                <th style={styles.th}>Data reporte</th>
                <th style={styles.th}>Data fim</th>
                <th style={styles.th}>Observações</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={11} style={styles.empty}>
                    Sem ocorrências concluídas para os filtros escolhidos
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((item) => {
                  const signedPhotoUrl = photoUrls[item.id]

                  return (
                    <tr key={item.id}>
                      <td style={styles.td}>
                        {signedPhotoUrl ? (
                          <a href={signedPhotoUrl} target="_blank" rel="noreferrer">
                            <img
                              src={signedPhotoUrl}
                              alt={item.ocorrencia || 'Fotografia da ocorrência'}
                              style={styles.imageThumb}
                            />
                          </a>
                        ) : (
                          <div style={styles.noImage}>Sem foto</div>
                        )}
                      </td>

                      <td style={styles.td}>{item.ocorrencia || '-'}</td>
                      <td style={styles.td}>
                        {getUnitName(item.units, item.local_ocorrencia)}
                      </td>
                      <td style={styles.td}>{item.categoria || 'Sem categoria'}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...getPrioridadeBadgeStyle(item.prioridade) }}>
                          {item.prioridade || '-'}
                        </span>
                      </td>
                      <td style={styles.td}>{item.impacto || '-'}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...getEstadoBadgeStyle(item.estado) }}>
                          {item.estado || '-'}
                        </span>
                      </td>
                      <td style={styles.td}>{formatDate(item.data_reporte)}</td>
                      <td style={styles.td}>{formatDateTime(item.data_encerramento)}</td>
                      <td style={{ ...styles.td, ...styles.obsCell }}>{item.observacoes || '-'}</td>
                      <td style={styles.td}>
                        <div style={styles.actionsCell}>
                          <Link href={`/dashboard/ocorrencia/${item.id}`} style={styles.editBtn}>
                            {role === 'consulta' ? 'Consultar' : 'Ver'}
                          </Link>

                          {role === 'admin' ? (
                            <button
                              type="button"
                              style={{
                                ...styles.deleteBtn,
                                ...(deletingId === item.id ? styles.deleteBtnDisabled : {}),
                              }}
                              onClick={() => void handleDelete(item)}
                              disabled={deletingId === item.id}
                            >
                              {deletingId === item.id ? 'A apagar...' : 'Apagar'}
                            </button>
                          ) : null}
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
