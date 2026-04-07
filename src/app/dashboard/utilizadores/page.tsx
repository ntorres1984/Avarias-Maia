'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import DashboardTopbar from '../../../components/dashboard/DashboardTopbar'

type Profile = {
  id: string
  nome: string | null
  email: string | null
  role: string | null
  ativo: boolean | null
}

function getRoleLabel(role: string | null) {
  if (role === 'admin') return 'Administrador'
  if (role === 'gestor') return 'Gestor'
  if (role === 'tecnico') return 'Técnico'
  if (role === 'consulta') return 'Consulta'
  return 'Utilizador'
}

const styles = {
  page: {
    padding: '24px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
  } as const,

  tableWrapper: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'auto',
  } as const,

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    minWidth: '1250px',
  },

  th: {
    padding: '12px',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    textAlign: 'left' as const,
    fontSize: '14px',
    color: '#334155',
  },

  td: {
    padding: '12px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '14px',
    verticalAlign: 'middle' as const,
  },

  select: {
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#fff',
    minWidth: '170px',
  } as const,

  error: {
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '12px',
    fontSize: '14px',
  } as const,

  success: {
    color: '#166534',
    backgroundColor: '#dcfce7',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '12px',
    fontSize: '14px',
  } as const,

  badge: {
    padding: '4px 8px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    display: 'inline-block',
  } as const,

  actionsWrap: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },

  btnDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  } as const,

  btnSuccess: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  } as const,

  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  } as const,

  smallInfo: {
    color: '#64748b',
    fontSize: '12px',
    marginTop: '4px',
  } as const,
}

function getBadge(role: string | null) {
  if (role === 'admin') {
    return { ...styles.badge, background: '#fee2e2', color: '#b91c1c' }
  }

  if (role === 'gestor') {
    return { ...styles.badge, background: '#dcfce7', color: '#166534' }
  }

  if (role === 'tecnico') {
    return { ...styles.badge, background: '#dbeafe', color: '#1d4ed8' }
  }

  if (role === 'consulta') {
    return { ...styles.badge, background: '#ede9fe', color: '#6d28d9' }
  }

  return { ...styles.badge, background: '#e2e8f0', color: '#334155' }
}

export default function UtilizadoresPage() {
  const supabase = createClient()
  const router = useRouter()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canManageUsers =
    currentUser?.role === 'admin' || currentUser?.role === 'gestor'

  async function loadUsers(showLoader = true) {
    if (showLoader) setLoading(true)
    setError('')
    setSuccess('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
    }

    const { data: me, error: meError } = await supabase
      .from('profiles')
      .select('id, nome, email, role, ativo')
      .eq('id', user.id)
      .single()

    if (meError || !me) {
      setError(meError?.message || 'Não foi possível carregar o perfil atual.')
      setLoading(false)
      return
    }

    setCurrentUser(me as Profile)

    if (!['admin', 'gestor'].includes(me.role || '')) {
      router.replace('/dashboard')
      return
    }

    const { data, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nome, email, role, ativo')
      .order('nome', { ascending: true })

    if (profilesError) {
      setError(profilesError.message)
      setProfiles([])
    } else {
      setProfiles((data || []) as Profile[])
    }

    if (showLoader) setLoading(false)
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  function canManagerEditTarget(targetUser: Profile) {
    if (!currentUser?.role) return false

    if (currentUser.role === 'admin') {
      return true
    }

    if (currentUser.role === 'gestor') {
      return targetUser.role === 'tecnico' || targetUser.role === 'user'
    }

    return false
  }

  function getAllowedRolesForEditor() {
    if (currentUser?.role === 'admin') {
      return ['admin', 'gestor', 'tecnico', 'user', 'consulta']
    }

    if (currentUser?.role === 'gestor') {
      return ['tecnico', 'user']
    }

    return ['user']
  }

  async function updateRole(id: string, newRole: string) {
    if (!canManageUsers) return

    const targetUser = profiles.find((u) => u.id === id)

    if (!targetUser) {
      setError('Utilizador não encontrado.')
      return
    }

    if (currentUser?.id === id && currentUser.role === 'admin' && newRole !== 'admin') {
      setError('Não podes retirar a ti próprio o perfil de administrador.')
      return
    }

    if (currentUser?.role === 'gestor') {
      if (targetUser.role !== 'tecnico' && targetUser.role !== 'user') {
        setError('O gestor só pode gerir utilizadores técnicos e utilizadores normais.')
        return
      }

      if (!['tecnico', 'user'].includes(newRole)) {
        setError('O gestor só pode atribuir os perfis técnico e utilizador.')
        return
      }
    }

    setSavingId(id)
    setError('')
    setSuccess('')

    const { data: updatedRow, error: updateError } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', id)
      .select('id, nome, email, role, ativo')
      .maybeSingle()

    if (updateError) {
      setError(`Erro ao alterar perfil: ${updateError.message}`)
      setSavingId(null)
      return
    }

    if (!updatedRow) {
      setError(
        'A alteração não foi gravada na base de dados. Verifica as permissões/RLS da tabela profiles.'
      )
      setSavingId(null)
      return
    }

    await loadUsers(false)
    setSuccess('Perfil atualizado com sucesso.')
    setSavingId(null)
  }

  async function updateAtivo(id: string, ativo: boolean) {
    if (!canManageUsers) return

    const targetUser = profiles.find((u) => u.id === id)

    if (!targetUser) {
      setError('Utilizador não encontrado.')
      return
    }

    if (currentUser?.id === id && ativo === false) {
      setError('Não podes desativar o teu próprio utilizador.')
      return
    }

    if (currentUser?.role === 'gestor') {
      if (targetUser.role !== 'tecnico' && targetUser.role !== 'user') {
        setError('O gestor só pode ativar ou desativar técnicos e utilizadores.')
        return
      }
    }

    setSavingId(id)
    setError('')
    setSuccess('')

    const { data: updatedRow, error: updateError } = await supabase
      .from('profiles')
      .update({ ativo })
      .eq('id', id)
      .select('id, nome, email, role, ativo')
      .maybeSingle()

    if (updateError) {
      setError(`Erro ao atualizar estado do utilizador: ${updateError.message}`)
      setSavingId(null)
      return
    }

    if (!updatedRow) {
      setError(
        'A alteração não foi gravada na base de dados. Verifica as permissões/RLS da tabela profiles.'
      )
      setSavingId(null)
      return
    }

    await loadUsers(false)
    setSuccess(
      ativo
        ? 'Utilizador reativado com sucesso.'
        : 'Utilizador desativado com sucesso.'
    )
    setSavingId(null)
  }

  const allowedRoles = getAllowedRolesForEditor()

  return (
    <div style={styles.page}>
      <DashboardTopbar
        title="Utilizadores"
        subtitle={`${currentUser?.nome || ''} • ${getRoleLabel(currentUser?.role)}`}
        actions={[
          { label: 'Voltar ao dashboard', href: '/dashboard', variant: 'gray' },
        ]}
      />

      {error ? <div style={styles.error}>{error}</div> : null}
      {success ? <div style={styles.success}>{success}</div> : null}

      {loading ? (
        <div>A carregar...</div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Perfil atual</th>
                <th style={styles.th}>Alterar perfil</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={6} style={styles.td}>
                    Sem utilizadores para mostrar.
                  </td>
                </tr>
              ) : (
                profiles.map((u) => {
                  const isSelf = currentUser?.id === u.id
                  const isSaving = savingId === u.id
                  const canEditTarget = canManagerEditTarget(u)

                  return (
                    <tr key={u.id}>
                      <td style={styles.td}>{u.email || '-'}</td>
                      <td style={styles.td}>{u.nome || '-'}</td>

                      <td style={styles.td}>
                        <span style={getBadge(u.role)}>{getRoleLabel(u.role)}</span>
                      </td>

                      <td style={styles.td}>
                        <select
                          style={styles.select}
                          value={u.role || 'user'}
                          disabled={!canManageUsers || !canEditTarget || isSaving}
                          onChange={(e) => void updateRole(u.id, e.target.value)}
                        >
                          {allowedRoles.map((roleValue) => (
                            <option key={roleValue} value={roleValue}>
                              {getRoleLabel(roleValue)}
                            </option>
                          ))}
                        </select>

                        {currentUser?.role === 'gestor' ? (
                          <div style={styles.smallInfo}>
                            O gestor só pode atribuir Técnico e Utilizador.
                          </div>
                        ) : null}
                      </td>

                      <td style={styles.td}>{u.ativo ? 'Ativo' : 'Inativo'}</td>

                      <td style={styles.td}>
                        <div style={styles.actionsWrap}>
                          {u.ativo ? (
                            <button
                              type="button"
                              style={{
                                ...styles.btnDanger,
                                ...(isSaving || isSelf || !canEditTarget
                                  ? styles.btnDisabled
                                  : {}),
                              }}
                              disabled={isSaving || isSelf || !canEditTarget}
                              onClick={() => void updateAtivo(u.id, false)}
                              title={
                                isSelf
                                  ? 'Não podes desativar o teu próprio utilizador.'
                                  : !canEditTarget
                                  ? 'Não tens permissão para alterar este utilizador.'
                                  : ''
                              }
                            >
                              {isSaving ? 'A guardar...' : 'Desativar'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              style={{
                                ...styles.btnSuccess,
                                ...(isSaving || !canEditTarget ? styles.btnDisabled : {}),
                              }}
                              disabled={isSaving || !canEditTarget}
                              onClick={() => void updateAtivo(u.id, true)}
                              title={
                                !canEditTarget
                                  ? 'Não tens permissão para alterar este utilizador.'
                                  : ''
                              }
                            >
                              {isSaving ? 'A guardar...' : 'Reativar'}
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
