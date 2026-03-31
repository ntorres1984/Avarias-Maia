'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string
  nome: string | null
  email: string | null
  perfil: string | null
}

const ROLES = ['admin', 'gestor', 'tecnico']

export default function UtilizadoresPage() {
  const supabase = createClient()

  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  async function loadUsers() {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, perfil')
      .order('email')

    if (!error && data) {
      setUsers(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function updateRole(userId: string, newRole: string) {
    setSavingId(userId)

    const { error } = await supabase
      .from('profiles')
      .update({ perfil: newRole })
      .eq('id', userId)

    if (!error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, perfil: newRole } : u
        )
      )
    } else {
      alert('Erro ao atualizar perfil: ' + error.message)
    }

    setSavingId(null)
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Gestão de Utilizadores</h1>

      {loading ? (
        <p>A carregar...</p>
      ) : (
        <table style={{ width: '100%', marginTop: 20 }}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Nome</th>
              <th>Perfil</th>
              <th>Ação</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.nome || '-'}</td>

                <td>
                  <select
                    value={user.perfil || 'tecnico'}
                    onChange={(e) =>
                      updateRole(user.id, e.target.value)
                    }
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  {savingId === user.id ? 'A guardar...' : '✔️'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
