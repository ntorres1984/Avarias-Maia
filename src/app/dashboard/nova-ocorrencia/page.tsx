'use client'

import { useEffect, useState } from 'react'
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

export default function NovaOcorrenciaPage() {
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
      const { data, error } = await supabase
        .from('units')
        .select('id, nome')
        .order('nome', { ascending: true })

      if (!error && data) {
        setUnits(data)
      }
    }

    loadUnits()
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (!unidadeId) {
      alert('Seleciona uma unidade.')
      setLoading(false)
      return
    }

    if (!descricao.trim()) {
      alert('Preenche a descrição.')
      setLoading(false)
      return
    }

    if (!categoria) {
      alert('Seleciona a categoria.')
      setLoading(false)
      return
    }

    if (!prioridade) {
      alert('Seleciona a prioridade.')
      setLoading(false)
      return
    }

    if (!impacto) {
      alert('Seleciona o impacto.')
      setLoading(false)
      return
    }

    const unidadeSelecionada = units.find((u) => u.id === unidadeId)

    if (!unidadeSelecionada) {
      alert('Unidade inválida.')
      setLoading(false)
      return
    }

    const agora = new Date()
    const agoraIso = agora.toISOString()
    const hoje = agoraIso.slice(0, 10)

    const payload = {
      unidade_id: unidadeSelecionada.id,
      local_ocorrencia: unidadeSelecionada.nome,
      ocorrencia: descricao.trim(),
      categoria,
      prioridade,
      impacto,
      estado: 'Em aberto',
      data_reporte: hoje,
      data_estado: agoraIso,
      observacoes: observacoes.trim() || null,
    }

    const { error } = await supabase.from('occurrences').insert([payload])

    if (error) {
      alert('Erro ao guardar: ' + error.message)
      setLoading(false)
      return
    }

    window.location.href = '/dashboard?refresh=' + Date.now()
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
          alignItems: 'flex-start',
          marginTop: 20,
        }}
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

        <textarea
          placeholder="Observações"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          style={{ minWidth: 220 }}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'A guardar...' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}
