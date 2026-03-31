'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardTopbar from '@/components/dashboard/DashboardTopbar'

type Profile = {
  id: string
  nome: string | null
  email: string | null
  perfil: string | null
}

const ROLES = ['admin', 'gestor', 'tecnico', 'user'] as const

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
    marginBottom: '20px',
  } as const,

  error: {
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
  } as const,

  info: {
    color: '#1e3a8a',
    backgroundColor: '#dbeafe',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
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
  },

  td: {
    borderBottom: '1px solid #f1f5f9',
    padding: '14px 12px',
    fontSize: '14px',
    verticalAlign: 'middle' as const,
  },

  select: {
    minHeight: '40px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    minWidth: '150px',
  } as const,

  status: {
    fontSize: '13px',
    fontWeight: 600,
  } as const,

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
  } as const,
}

function getRoleBadgeStyle(role: string | null) {
  if (role === 'admin') {
    return { ...styles.badge, backgroundColor: '#fee2e2', color: '#b91c1c' }
  }
  if (role === 'gestor') {
    return { ...styles.badge, backgroundColor: '#ffedd5', color: '#c2410c' }
  }
  if (role === 'tecnico') {
    return { ...styles.badge, backgroundColor: '#dbeafe', color: '#1d4ed8' }
  }
  return { ...styles.badge, backgroundColor: '#e2e8f0', color: '#334155' }
}

export default function UtilizadoresPage() {
  const supabase = createClient()
  const router = useRouter()

  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [currentRole, setCurrentRole] = useState<string | null>(null)

  async function loadUsers() {
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

    const { data: me } = await supabase
      .from('profiles')
      .select('perfil')
      .eq('id', user.id)
      .maybeSingle()

    const role = me?.perfil || 'user'
    setCurrentRole(role)

    if (!['admin', 'gestor'].includes(role)) {
      router.replace('/dashboard')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, perfil')
      .order('email')

    if (error) {
      setErrorMessage(`Erro ao carregar utilizadores: ${error.message}`)
      setUsers([])
      setLoading(false)
      return
    }

    setUsers((data || []) as Profile[])
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function updateRole(userId: string, newRole: string) {
    setSavingId(userId)
    setErrorMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({ perfil: newRole })
      .eq('id', userId)

    if (error) {
      setErrorMessage(`Erro ao atualizar perfil: ${error.message}`)
      setSavingId(null)
      return
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, perfil: newRole } : u))
    )

    setSavingId(null)
  }

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => (a.email || '').localeCompare(b.email || ''))
  }, [users])

  return (
    <div style={styles.page}>
      <DashboardTopbar
        title="Utilizadores"
        subtitle="Gestão de perfis e permissões da aplicação."
        actions={[
          {
            label: 'Voltar ao dashboard',
            href: '/dashboard',
            variant: 'default',
          },
        ]}
      />

      {errorMessage && <div style={styles.error}>{errorMessage}</div>}

      <div style={styles.info}>
        Perfis disponíveis: <strong>admin</strong>, <strong>gestor</strong>,{' '}
        <strong>tecnico</strong> e <strong>user</strong>.
      </div>

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
              {sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={styles.empty}>
                    Sem utilizadores.
                  </td>
                </tr>
              ) : (
                sortedUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={styles.td}>{user.email || '-'}</td>
                    <td style={styles.td}>{user.nome || '-'}</td>
                    <td style={styles.td}>
                      <span style={getRoleBadgeStyle(user.perfil)}>
                        {user.perfil || 'user'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <select
                        style={styles.select}
                        value={user.perfil || 'user'}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                        disabled={savingId === user.id}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.status}>
                        {savingId === user.id ? 'A guardar...' : 'OK'}
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
