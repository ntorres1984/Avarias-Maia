'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string
  email: string | null
  nome: string | null
  role: string | null
  ativo: boolean | null
  created_at: string | null
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('pt-PT')
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
    gap: '16px',
    flexWrap: 'wrap' as const,
    marginBottom: '24px',
  },

  title: {
    margin: 0,
    fontSize: '40px',
    fontWeight: 700,
  } as const,

  backLink: {
    color: '#475569',
    textDecoration: 'none',
    fontWeight: 600,
  } as const,

  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },

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

  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
    marginBottom: '20px',
  } as const,

  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '28px',
    fontWeight: 700,
  } as const,

  infoBox: {
    color: '#1e3a8a',
    backgroundColor: '#dbeafe',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
  } as const,

  messageSuccess: {
    color: '#166534',
    backgroundColor: '#dcfce7',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
  } as const,

  messageError: {
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
  } as const,

  filtersBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '18px',
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
    alignItems: 'flex-end',
  },

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

  input: {
    width: '100%',
    minHeight: '42px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '10px 12px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },

  select: {
    width: '100%',
    minHeight: '42px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '10px 12px',
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
    minWidth: '1100px',
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

  rowActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },

  saveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #0f172a',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '13px',
  } as const,
}

function getRoleBadgeStyle(role: string | null) {
  if (role === 'admin') {
    return { ...styles.badgeBase, backgroundColor: '#dbeafe', color: '#1d4ed8' }
  }

  return { ...styles.badgeBase, backgroundColor: '#e2e8f0', color: '#334155' }
}

function getAtivoBadgeStyle(ativo: boolean | null) {
  if (ativo === false) {
    return { ...styles.badgeBase, backgroundColor: '#fee2e2', color: '#b91c1c' }
  }

  return { ...styles.badgeBase, backgroundColor: '#dcfce7', color: '#166534' }
}

export default function UtilizadoresPage() {
  const supabase = createClient()
  const router = useRouter()

  const [rows, setRows] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroRole, setFiltroRole] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState('')

  const [editedRoles, setEditedRoles] = useState<Record<string, string>>({})
  const [editedAtivos, setEditedAtivos] = useState<Record<string, boolean>>({})

  async function checkAdminAndLoad() {
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      router.replace('/login')
      return
    }

    const { data: ownProfile, error: ownError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (ownError || !ownProfile || ownProfile.role !== 'admin') {
      setIsAdmin(false)
      setRows([])
      setErrorMessage('Acesso reservado a administradores.')
      setLoading(false)
      router.replace('/dashboard')
      return
    }

    setIsAdmin(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, nome, role, ativo, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setErrorMessage(error.message)
      setRows([])
      setLoading(false)
      return
    }

    const profiles = (data || []) as Profile[]
    setRows(profiles)

    const nextRoles: Record<string, string> = {}
    const nextAtivos: Record<string, boolean> = {}

    profiles.forEach((item) => {
      nextRoles[item.id] = item.role || 'user'
      nextAtivos[item.id] = item.ativo !== false
    })

    setEditedRoles(nextRoles)
    setEditedAtivos(nextAtivos)
    setLoading(false)
  }

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  const listaFiltrada = rows.filter((item) => {
    const texto = filtroTexto.trim().toLowerCase()
    const nome = (item.nome || '').toLowerCase()
    const email = (item.email || '').toLowerCase()
    const role = item.role || 'user'
    const ativo = item.ativo !== false

    const matchTexto =
      !texto || nome.includes(texto) || email.includes(texto)

    const matchRole = !filtroRole || role === filtroRole

    const matchAtivo =
      !filtroAtivo ||
      (filtroAtivo === 'ativo' && ativo) ||
      (filtroAtivo === 'inativo' && !ativo)

    return matchTexto && matchRole && matchAtivo
  })

  async function handleSaveUser(profileId: string) {
    setSavingId(profileId)
    setErrorMessage('')
    setSuccessMessage('')

    const role = editedRoles[profileId] || 'user'
    const ativo = editedAtivos[profileId] ?? true

    const { error } = await supabase
      .from('profiles')
      .update({
        role,
        ativo,
      })
      .eq('id', profileId)

    if (error) {
      setErrorMessage(error.message)
      setSavingId(null)
      return
    }

    setRows((prev) =>
      prev.map((item) =>
        item.id === profileId ? { ...item, role, ativo } : item
      )
    )

    setSuccessMessage('Utilizador atualizado com sucesso.')
    setSavingId(null)
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Gestão de utilizadores</h1>
          <div style={{ marginTop: 8 }}>
            <Link href="/dashboard" style={styles.backLink}>
              ← Voltar ao dashboard
            </Link>
          </div>
        </div>

        <div style={styles.actions}>
          <button style={styles.btn} onClick={() => checkAdminAndLoad()}>
            Atualizar lista
          </button>
        </div>
      </div>

      <div style={styles.infoBox}>
        Apenas administradores podem aceder e alterar utilizadores.
      </div>

      {errorMessage && <div style={styles.messageError}>{errorMessage}</div>}
      {successMessage && <div style={styles.messageSuccess}>{successMessage}</div>}

      {!isAdmin && !loading ? null : (
        <>
          <div style={styles.filtersBox}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Procurar por nome ou email</label>
              <input
                style={styles.input}
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                placeholder="Nome ou email"
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>Role</label>
              <select
                style={styles.select}
                value={filtroRole}
                onChange={(e) => setFiltroRole(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>Estado</label>
              <select
                style={styles.select}
                value={filtroAtivo}
                onChange={(e) => setFiltroAtivo(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>

            <div>
              <button
                style={styles.btn}
                onClick={() => {
                  setFiltroTexto('')
                  setFiltroRole('')
                  setFiltroAtivo('')
                }}
              >
                Limpar filtros
              </button>
            </div>
          </div>

          {loading ? (
            <div style={styles.card}>A carregar...</div>
          ) : (
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Utilizadores</h2>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Nome</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Role atual</th>
                      <th style={styles.th}>Estado atual</th>
                      <th style={styles.th}>Criado em</th>
                      <th style={styles.th}>Editar role</th>
                      <th style={styles.th}>Editar estado</th>
                      <th style={styles.th}>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {listaFiltrada.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={styles.empty}>
                          Sem utilizadores para os filtros escolhidos
                        </td>
                      </tr>
                    ) : (
                      listaFiltrada.map((item) => {
                        const editedRole = editedRoles[item.id] || 'user'
                        const editedAtivo = editedAtivos[item.id] ?? true
                        const isSaving = savingId === item.id

                        return (
                          <tr key={item.id}>
                            <td style={styles.td}>{item.nome || '-'}</td>
                            <td style={styles.td}>{item.email || '-'}</td>

                            <td style={styles.td}>
                              <span style={getRoleBadgeStyle(item.role)}>
                                {item.role || 'user'}
                              </span>
                            </td>

                            <td style={styles.td}>
                              <span style={getAtivoBadgeStyle(item.ativo)}>
                                {item.ativo === false ? 'Inativo' : 'Ativo'}
                              </span>
                            </td>

                            <td style={styles.td}>{formatDateTime(item.created_at)}</td>

                            <td style={styles.td}>
                              <select
                                style={styles.select}
                                value={editedRole}
                                onChange={(e) =>
                                  setEditedRoles((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.value,
                                  }))
                                }
                              >
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                              </select>
                            </td>

                            <td style={styles.td}>
                              <select
                                style={styles.select}
                                value={editedAtivo ? 'ativo' : 'inativo'}
                                onChange={(e) =>
                                  setEditedAtivos((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.value === 'ativo',
                                  }))
                                }
                              >
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                              </select>
                            </td>

                            <td style={styles.td}>
                              <div style={styles.rowActions}>
                                <button
                                  style={styles.saveBtn}
                                  onClick={() => handleSaveUser(item.id)}
                                  disabled={isSaving}
                                >
                                  {isSaving ? 'A guardar...' : 'Guardar'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
