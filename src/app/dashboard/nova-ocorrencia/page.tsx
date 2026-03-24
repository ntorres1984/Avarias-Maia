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
  'Sistema Elétrico',
  'Água Quente Sanitária',
  'Serralharia',
  'Carpintaria',
  'Águas Residuais',
  'Águas Pluviais',
  'Desratização',
  'Arranjos Exteriores',
  'Sinalética',
  'Deteção de Incêndio',
  'Canalização',
  'Inundações',
  'Edificado',
  'Outro',
  'Vidros',
]

const prioridades = ['Baixa', 'Média', 'Alta']
const impactos = ['Baixo', 'Médio', 'Alto', 'Crítico']

export default function NovaOcorrencia() {
  const router = useRouter()
  const supabase = createClient()

  const [units, setUnits] = useState<Unit[]>([])
  const [unidadeId, setUnidadeId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [prioridade, setPrioridade] = useState('')
  const [impacto, setImpacto] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadUnits = async () => {
      const { data, error } = await supabase
        .from('units')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome', { ascending: true })

      if (error) {
        alert('Erro ao carregar unidades: ' + error.message)
        return
      }

      setUnits(data || [])
    }

    loadUnits()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const unidadeSelecionada = units.find((u) => u.id === unidadeId)

    if (!unidadeSelecionada) {
      alert('Seleciona uma unidade válida')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('occurrences').insert([
      {
        unidade_id: unidadeSelecionada.id,
        local_ocorrencia: unidadeSelecionada.nome,
        ocorrencia: descricao,
        categoria,
        prioridade,
        impacto,
        estado: 'Em aberto',
        data_reporte: new Date().toISOString(),
      },
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

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}
      >
        <select
          value={unidadeId}
          onChange={(e) => setUnidadeId(e.target.value)}
          required
        >
          <option value="">Selecionar unidade</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.nome}
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
          {categorias.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={prioridade}
          onChange={(e) => setPrioridade(e.target.value)}
          required
        >
          <option value="">Prioridade</option>
          {prioridades.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={impacto}
          onChange={(e) => setImpacto(e.target.value)}
          required
        >
          <option value="">Impacto</option>
          {impactos.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button type="submit" disabled={loading}>
          {loading ? 'A guardar...' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}
