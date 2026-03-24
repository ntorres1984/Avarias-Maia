'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NovaOcorrencia() {
  const router = useRouter()
  const supabase = createClient()

  const [local, setLocal] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [prioridade, setPrioridade] = useState('')
  const [impacto, setImpacto] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('occurrences').insert([
      {
        local_ocorrencia: local,
        ocorrencia: descricao,
        categoria,
        prioridade,
        impacto,
        estado: 'Em aberto'
      }
    ])

    if (error) {
      alert('Erro ao guardar: ' + error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Nova Ocorrência</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          placeholder="Local"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          required
        />

        <input
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />

        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Categoria</option>
          <option value="Iluminação">Iluminação</option>
          <option value="Equipamento">Equipamento</option>
        </select>

        <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
          <option value="">Prioridade</option>
          <option value="Baixa">Baixa</option>
          <option value="Média">Média</option>
          <option value="Alta">Alta</option>
        </select>

        <select value={impacto} onChange={(e) => setImpacto(e.target.value)}>
          <option value="">Impacto</option>
          <option value="Baixo">Baixo</option>
          <option value="Médio">Médio</option>
          <option value="Alto">Alto</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? 'A guardar...' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}
