'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type UnitRelation =
  | {
      nome: string | null
    }
  | {
      nome: string | null
    }[]
  | null

type Occurrence = {
  id: string
  ocorrencia: string | null
  local_ocorrencia: string | null
  categoria: string | null
  prioridade: string | null
  impacto: string | null
  estado: string | null
  data_reporte: string | null
  data_estado: string | null
  data_encerramento: string | null
  observacoes: string | null
  units: UnitRelation
}

const estados = ['Em aberto', 'Em análise', 'Em execução', 'Concluída', 'Encerrada']

function getUnitName(units: UnitRelation, fallback: string | null) {
  if (Array.isArray(units)) {
    return units[0]?.nome || fallback || '-'
  }

  return units?.nome || fallback || '-'
}

function toDateTimeLocal(dateString: string | null) {
  if (!dateString) return ''

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''

  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60000)

  return localDate.toISOString().slice(0, 16)
}

function fromDateTimeLocal(value: string) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

export default function EditarOcorrenciaPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()

  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [ocorrencia, setOcorrencia] = useState('')
  const [unidade, setUnidade] = useState('')
  const [categoria, setCategoria] = useState('')
  const [prioridade, setPrioridade] = useState('')
  const [impacto, setImpacto] = useState('')
  const [estado, setEstado] = useState('Em aberto')
  const [dataReporte, setDataReporte] = useState('')
  const [dataEstado, setDataEstado] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    async function loadOccurrence() {
      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('occurrences')
        .select(`
          id,
          ocorrencia,
          local_ocorrencia,
          categoria,
          prioridade,
          impacto,
          estado,
          data_reporte,
          data_estado,
          data_encerramento,
          observacoes,
          units (
            nome
          )
        `)
        .eq('id', id)
        .single()

      if (error || !data) {
        setErrorMessage(error?.message || 'Ocorrência não encontrada.')
        setLoading(false)
        return
      }

      const item = data as Occurrence

      setOcorrencia(item.ocorrencia || '')
      setUnidade(getUnitName(item.units, item.local_ocorrencia))
      setCategoria(item.categoria || '')
      setPrioridade(item.prioridade || '')
      setImpacto(item.impacto || '')
      setEstado(item.estado || 'Em aberto')
      setDataReporte(item.data_reporte || '')
      setDataEstado(toDateTimeLocal(item.data_estado))
      setDataFim(toDateTimeLocal(item.data_encerramento))
      setObservacoes(item.observacoes || '')

      setLoading(false)
    }

    if (id) {
      loadOccurrence()
    }
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrorMessage('')

    let dataEstadoIso = fromDateTimeLocal(dataEstado)
    if (!dataEstadoIso) {
      dataEstadoIso = new Date().toISOString()
    }

    let dataFimIso = fromDateTimeLocal(dataFim)

    if ((estado === 'Concluída' || estado === 'Encerrada') && !dataFimIso) {
      dataFimIso = dataEstadoIso
    }

    if (estado === 'Em aberto' || estado === 'Em análise' || estado === 'Em execução') {
      dataFimIso = dataFim ? fromDateTimeLocal(dataFim) : null
    }

    const { error } = await supabase
      .from('occurrences')
      .update({
        estado,
        data_estado: dataEstadoIso,
        data_encerramento: dataFimIso,
        observacoes: observacoes.trim() || null,
      })
      .eq('id', id)

    if (error) {
      setErrorMessage('Erro ao guardar: ' + error.message)
      setSaving(false)
      return
    }

    router.push('/dashboard?refresh=' + Date.now())
    router.refresh()
  }

  if (loading) {
    return <div style={{ padding: 20 }}>A carregar...</div>
  }

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/dashboard">← Voltar ao dashboard</Link>
      </div>

      <h1>Editar Ocorrência</h1>

      {errorMessage && (
        <p style={{ color: 'red', marginBottom: 16 }}>{errorMessage}</p>
      )}

      <form
        onSubmit={handleSave}
        style={{
          display: 'grid',
          gap: 16,
          marginTop: 20,
        }}
      >
        <div>
          <label>Ocorrência</label>
          <input value={ocorrencia} disabled style={{ width: '100%' }} />
        </div>

        <div>
          <label>Unidade</label>
          <input value={unidade} disabled style={{ width: '100%' }} />
        </div>

        <div>
          <label>Categoria</label>
          <input value={categoria} disabled style={{ width: '100%' }} />
        </div>

        <div>
          <label>Prioridade</label>
          <input value={prioridade} disabled style={{ width: '100%' }} />
        </div>

        <div>
          <label>Impacto</label>
          <input value={impacto} disabled style={{ width: '100%' }} />
        </div>

        <div>
          <label>Estado</label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            style={{ width: '100%' }}
          >
            {estados.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Data reporte</label>
          <input value={dataReporte || ''} disabled style={{ width: '100%' }} />
        </div>

        <div>
          <label>Data alteração de estado</label>
          <input
            type="datetime-local"
            value={dataEstado}
            onChange={(e) => setDataEstado(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label>Data fim</label>
          <input
            type="datetime-local"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label>Observações</label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={5}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <button type="submit" disabled={saving}>
            {saving ? 'A guardar...' : 'Guardar alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
