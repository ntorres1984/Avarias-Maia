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
  },

  th: {
    padding: '12px',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    textAlign: 'left' as const,
  },

  td: {
    padding: '12px',
    borderBottom: '1px solid #f1f5f9',
  },

  select: {
    padding: '6px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
  } as const,

  error: {
    color: '#b91c1c',
    marginBottom: '10px',
  },

  badge: {
    padding: '4px 8px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
  },
}

function getBadge(role: string | null) {
  if (role === 'admin') return { ...styles.badge, background: '#fee2e2', color: '#b91c1c' }
  if (role === 'gestor') return { ...styles.badge, background: '#dcfce7', color: '#166534' }
  if (role === 'tecnico') return { ...styles.badge, background: '#dbeafe', color: '#1d4ed8' }
  return { ...styles.badge, background: '#e2e8f0', color: '#334155' }
}

export default function UtilizadoresPage() {
  const supabase = createClient()
  const router = useRouter()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadUsers() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
    }

    const { data: me } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setCurrentUser(me)

    // 🔒 BLOQUEIO TOTAL
    if (!['admin', 'gestor'].includes(me?.role)) {
      router.replace('/dashboard')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('nome')

    if (error) {
      setError(error.message)
      setProfiles([])
    } else {
      setProfiles(data as Profile[])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function updateRole(id: string, role: string) {
    if (!['admin', 'gestor'].includes(currentUser?.role || '')) return

    await supabase.from('profiles').update({ role }).eq('id', id)

    setProfiles((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role } : u))
    )
  }

  return (
    <div style={styles.page}>
      <DashboardTopbar
        title="Utilizadores"
        subtitle={`${currentUser?.nome || ''} • ${getRoleLabel(currentUser?.role)}`}
        actions={[
          { label: 'Voltar ao dashboard', href: '/dashboard', variant: 'gray' },
        ]}
      />

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div>A carregar...</div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Perfil</th>
                <th style={styles.th}>Alterar</th>
                <th style={styles.th}>Estado</th>
              </tr>
            </thead>

            <tbody>
              {profiles.map((u) => (
                <tr key={u.id}>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>{u.nome}</td>

                  <td style={styles.td}>
                    <span style={getBadge(u.role)}>
                      {getRoleLabel(u.role)}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <select
                      style={styles.select}
                      value={u.role || 'user'}
                      disabled={!['admin', 'gestor'].includes(currentUser?.role || '')}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                    >
                      <option value="admin">admin</option>
                      <option value="gestor">gestor</option>
                      <option value="tecnico">tecnico</option>
                      <option value="user">user</option>
                    </select>
                  </td>

                  <td style={styles.td}>
                    {u.ativo ? 'OK' : 'Inativo'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
