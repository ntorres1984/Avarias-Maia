'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardTopbar from '@/components/dashboard/DashboardTopbar'

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
  return 'Utilizador'
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

  success: {
    color: '#166534',
    backgroundColor: '#dcfce7',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
  } as const,

  info: {
    color: '#1d4ed8',
    backgroundColor: '#dbeafe',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
  } as const,

  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
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
    whiteSpace: 'nowrap' as const,
  },

  td: {
    borderBottom: '1px solid #f1f5f9',
    padding: '14px 12px',
    fontSize: '14px',
    verticalAlign: 'middle' as const,
  },

  select: {
    width: '180px',
    minHeight: '42px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  } as const,

  badgeBase: {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    whiteSpace: 'nowrap' as const,
  },

  statusOk: {
    color: '#166534',
    fontWeight: 700,
  } as const,

  statusInactive: {
    color: '#b91c1c',
    fontWeight: 700,
  } as const,
}

function getRoleBadgeStyle(role: string | null) {
  if (role === 'admin') {
    return { ...styles.badgeBase, backgroundColor: '#fee2e2', color: '#b91c1c' }
  }

  if (role === 'gestor') {
    return { ...styles.badgeBase, backgroundColor: '#dcfce7', color: '#166534' }
  }

  if (role === 'tecnico') {
    return { ...styles.badgeBase, backgroundColor: '#dbeafe', color: '#1d4ed8' }
  }

  return { ...styles.badgeBase, backgroundColor: '#e2e8f0', color: '#334155' }
}

export default function UtilizadoresPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])

  const currentRole = currentUser?.role || 'user'
  const canEditRoles = currentRole === 'admin'

  async function loadUsers() {
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

    const { data: me, error: meError } = await supabase
      .from('profiles')
      .select('id, nome, email, role, ativo')
      .eq('id', user.id)
      .maybeSingle()

    if (meError) {
      setErrorMessage(`Erro ao carregar o teu perfil: ${meError.message}`)
      setLoading(false)
      return
    }

    const myProfile = (me || null) as Profile | null
    setCurrentUser(myProfile)

    if (myProfile?.ativo === false) {
      await supabase.auth.signOut()
      router.replace('/login')
      return
    }

    if (!myProfile || !['admin', 'gestor'].includes(myProfile.role || 'user')) {
      router.replace('/dashboard')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, role, ativo')
      .order('nome', { ascending: true })

    if (error) {
      setErrorMessage(`Erro ao carregar utilizadores: ${error.message}`)
      setProfiles([])
      setLoading(false)
      return
    }

    setProfiles((data || []) as Profile[])
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function handleRoleChange(profileId: string, newRole: string) {
    if (!canEditRoles) return

    setSavingId(profileId)
    setErrorMessage('')
    setSuccessMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId)

    if (error) {
      setErrorMessage(`Erro ao atualizar perfil: ${error.message}`)
      setSavingId(null)
      return
    }

    setProfiles((prev) =>
      prev.map((item) =>
        item.id === profileId ? { ...item, role: newRole } : item
      )
    )

    setSuccessMessage('Perfil atualizado com sucesso.')
    setSavingId(null)
  }

  return (
    <div style={styles.page}>
      <DashboardTopbar
        title="Utilizadores"
        subtitle={`${currentUser?.nome || currentUser?.email || 'Utilizador'} • ${getRoleLabel(currentRole)}`}
        actions={[
          {
            label: 'Voltar ao dashboard',
            href: '/dashboard',
            variant: 'gray',
          },
        ]}
      />

      {errorMessage && <div style={styles.error}>{errorMessage}</div>}
      {successMessage && <div style={styles.success}>{successMessage}</div>}

      {!canEditRoles && currentRole === 'gestor' && (
        <div style={styles.info}>
          Estás a consultar os utilizadores em modo leitura. Só um administrador pode alterar perfis.
        </div>
      )}

      {loading ? (
        <div style={styles.card}>A carregar...</div>
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
              </tr>
            </thead>

            <tbody>
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...styles.td, textAlign: 'center' }}>
                    Sem utilizadores para mostrar.
                  </td>
                </tr>
              ) : (
                profiles.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.email || '-'}</td>
                    <td style={styles.td}>{item.nome || '-'}</td>
                    <td style={styles.td}>
                      <span style={getRoleBadgeStyle(item.role)}>
                        {getRoleLabel(item.role)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <select
                        style={styles.select}
                        value={item.role || 'user'}
                        disabled={!canEditRoles || savingId === item.id}
                        onChange={(e) => handleRoleChange(item.id, e.target.value)}
                      >
                        <option value="admin">admin</option>
                        <option value="gestor">gestor</option>
                        <option value="tecnico">tecnico</option>
                        <option value="user">user</option>
                      </select>
                    </td>
                    <td style={styles.td}>
                      <span style={item.ativo ? styles.statusOk : styles.statusInactive}>
                        {item.ativo ? 'OK' : 'Inativo'}
                      </span>
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
