'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Unit = {
  id: string
  nome: string
}

const categorias = [
  'Iluminação',
  'AVAC',
  'Arranjos Exteriores',
  'Outro',
]

const prioridades = ['Baixa', 'Média', 'Alta']
const impactos = ['Baixo', 'Médio', 'Alto']

export default function NovaOcorrenciaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [units, setUnits] = useState<Unit[]>([])
  const [unidadeId, setUnidadeId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [prioridade, setPrioridade] = useState('')
  const [impacto, setImpacto] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadUnits() {
      const { data } = await supabase
        .from('units')
        .select('id, nome')
        .order('nome')

      if (data) setUnits(data)
    }

    loadUnits()
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const unidadeSelecionada = units.find((u) => u.id === unidadeId)

    if (!unidadeSelecionada) {
      alert('Seleciona uma unidade válida')
      setLoading(false)
      return
    }

    const agora = new Date().toISOString()

    const { error } = await supabase.from('occurrences').insert([
      {
        unidade_id: unidadeSelecionada.id,
        local_ocorrencia: unidadeSelecionada.nome,
        ocorrencia: descricao,
        categoria,
        prioridade,
        impacto,
        estado: 'Em aberto',
        data_reporte: agora,
        data_estado: agora,
        observacoes: observacoes || '',
      },
    ])

    if (error) {
      alert('Erro ao guardar: ' + error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Nova Ocorrência</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginTop: 20,
        }}
      >
        <select
          value={unidadeId}
          onChange={(e) => setUnidadeId(e.target.value)}
          required
        >
          <option value="">Selecionar unidade</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome}
            </option>
          ))}
        </select>

        <input
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          required
        >
          <option value="">Categoria</option>
          {categorias.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select
          value={prioridade}
          onChange={(e) => setPrioridade(e.target.value)}
          required
        >
          <option value="">Prioridade</option>
          {prioridades.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>

        <select
          value={impacto}
          onChange={(e) => setImpacto(e.target.value)}
          required
        >
          <option value="">Impacto</option>
          {impactos.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>

        <textarea
          placeholder="Observações"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          style={{ minWidth: 250 }}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'A guardar...' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}
