'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const categorias = [
  'Iluminação',
  'AVAC',
  'Sistema Elétrico',
  'Água Quente Sanitária',
  'Serralharia',
  'Carpintaria',
  'Águas Residuais',
  'Águas Pluviais',
  'Controlo de pragas ou insetos', // ✅ ALTERADO
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
  const router = useRouter()

  const [ocorrencia, setOcorrencia] = useState('')
  const [local, setLocal] = useState('')
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

    if (!user) {
      alert('Sessão inválida')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('occurrences').insert({
      ocorrencia,
      local_ocorrencia: local,
      categoria,
      prioridade,
      impacto,
      estado: 'Em aberto',
      data_reporte: new Date().toISOString(),
      created_by: user.id,
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Nova Ocorrência</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
        <div>
          <label>Ocorrência</label>
          <input
            value={ocorrencia}
            onChange={(e) => setOcorrencia(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Local</label>
          <input
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Categoria</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            required
          >
            <option value="">Selecionar</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Prioridade</label>
          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
            required
          >
            <option value="">Selecionar</option>
            {prioridades.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Impacto</label>
          <select
            value={impacto}
            onChange={(e) => setImpacto(e.target.value)}
            required
          >
            <option value="">Selecionar</option>
            {impactos.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Observações</label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'A guardar...' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}
