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
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    void initPage()
  }, [])

  async function initPage() {
    setLoading(true)
    setErrorMsg(null)

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) throw authError

      if (!user) {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      const { data: myProfile, error: myProfileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (myProfileError) throw myProfileError

      if (!myProfile || myProfile.role !== 'admin') {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      await fetchUsers()
    } catch (error: any) {
      setErrorMsg(error?.message || 'Erro ao carregar utilizadores.')
      setLoading(false)
    }
  }

  async function fetchUsers() {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, role, ativo')
      .order('nome', { ascending: true })

    if (error) {
      setErrorMsg(error.message)
      setUsers([])
    } else {
      setUsers(data || [])
    }

    setLoading(false)
  }

  async function updateUser(
    id: string,
    field: 'role' | 'ativo',
    value: string | boolean
  ) {
    setErrorMsg(null)

    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', id)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    await fetchUsers()
  }

  if (loading) {
    return (
      <div className="p-6">
        <DashboardTopbar title="Utilizadores" />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          A carregar...
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="p-6">
        <DashboardTopbar title="Utilizadores" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
          Acesso negado.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <DashboardTopbar
        title="Utilizadores"
        subtitle="Gestão de perfis e permissões"
      />

      {errorMsg ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    Sem utilizadores encontrados.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{user.nome || '—'}</td>
                    <td className="px-4 py-3">{user.email || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role || 'user'}
                        onChange={(e) =>
                          void updateUser(user.id, 'role', e.target.value)
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                      >
                        <option value="admin">Administrador</option>
                        <option value="gestor">Gestor</option>
                        <option value="tecnico">Técnico</option>
                        <option value="user">Utilizador</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.ativo ? 'true' : 'false'}
                        onChange={(e) =>
                          void updateUser(
                            user.id,
                            'ativo',
                            e.target.value === 'true'
                          )
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                      >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
