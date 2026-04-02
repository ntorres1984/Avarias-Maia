'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import { CATEGORIAS, PRIORIDADES, IMPACTOS } from '../../../lib/constants'
import DashboardTopbar from '../../../components/dashboard/DashboardTopbar'

export default function NovaOcorrenciaPage() {
  const supabase = createClient()
  const router = useRouter()

  const [ocorrencia, setOcorrencia] = useState('')
  const [categoria, setCategoria] = useState('')
  const [prioridade, setPrioridade] = useState('')
  const [impacto, setImpacto] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from('occurrences').insert([
      {
        ocorrencia,
        categoria,
        prioridade,
        impacto,
        observacoes,
        estado: 'Em aberto',
        created_by: user.id,
      },
    ])

    router.push('/dashboard')
  }

  return (
    <div style={{ padding: 24 }}>
      <DashboardTopbar title="Nova Ocorrência" actions={[]} />

      <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
        <input
          placeholder="Ocorrência"
          value={ocorrencia}
          onChange={(e) => setOcorrencia(e.target.value)}
        />

        <select onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Categoria</option>
          {CATEGORIAS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select onChange={(e) => setPrioridade(e.target.value)}>
          <option value="">Prioridade</option>
          {PRIORIDADES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>

        <select onChange={(e) => setImpacto(e.target.value)}>
          <option value="">Impacto</option>
          {IMPACTOS.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>

        <textarea
          placeholder="Observações"
          onChange={(e) => setObservacoes(e.target.value)}
        />

        <button disabled={loading}>
          {loading ? 'A guardar...' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}
