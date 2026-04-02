'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardTopbar from '@/components/dashboard/DashboardTopbar'

type Profile = {
  id: string
  nome: string | null
  email: string | null
  role: string | null
  ativo: boolean | null
}

export default function UtilizadoresPage() {
  const supabase = createClient()

  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('nome', { ascending: true })

    if (!error && data) {
      setUsers(data)
    }

    setLoading(false)
  }

  async function updateUser(id: string, field: string, value: any) {
    await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', id)

    fetchUsers()
  }

  function getRoleLabel(role: string | null) {
    if (role === 'admin') return 'Administrador'
    if (role === 'gestor') return 'Gestor'
    if (role === 'tecnico') return 'Técnico'
    return 'Utilizador'
  }

  return (
    <div className="p-6">
      <DashboardTopbar title="Utilizadores" />

      {loading ? (
        <p className="mt-6">A carregar...</p>
      ) : (
        <div className="mt-6 bg-white rounded-xl shadow p-4 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Nome</th>
                <th className="p-2">Email</th>
                <th className="p-2">Perfil</th>
                <th className="p-2">Estado</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{user.nome}</td>
                  <td className="p-2">{user.email}</td>

                  <td className="p-2">
                    <select
                      value={user.role || 'user'}
                      onChange={(e) =>
                        updateUser(user.id, 'role', e.target.value)
                      }
                      className="border rounded px-2 py-1"
                    >
                      <option value="admin">Administrador</option>
                      <option value="gestor">Gestor</option>
                      <option value="tecnico">Técnico</option>
                      <option value="user">Utilizador</option>
                    </select>
                  </td>

                  <td className="p-2">
                    <select
                      value={user.ativo ? 'true' : 'false'}
                      onChange={(e) =>
                        updateUser(user.id, 'ativo', e.target.value === 'true')
                      }
                      className="border rounded px-2 py-1"
                    >
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </select>
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
