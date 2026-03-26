'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
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
  sla_dias: number | null
  fora_sla: boolean | null
  units: UnitRelation
}

type HistoryItem = {
  id: number
  occurrence_id: string
  estado_anterior: string | null
  estado_novo: string
  observacoes: string | null
  data_alteracao: string
}

const estados = ['Em aberto', 'Em análise', 'Em execução', 'Concluída', 'Encerrada']

function getUnitName(units: UnitRelation, fallback: string | null) {
  if (Array.isArray(units)) {
    return units[0]?.nome || fallback || '-'
  }
  return units?.nome || fallback || '-'
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('pt-PT')
}

function toInputDate(dateString: string | null) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function toInputDateTime(dateString: string | null) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function fromInputDate(value: string) {
  if (!value) return null
  return `${value}T00:00:00`
}

function fromInputDateTime(value: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

// ✅ FUNÇÃO SLA CORRIGIDA
function isForaSLA(item: {
  data_reporte: string | null
  data_encerramento: string | null
  sla_dias: number | null
  estado: string | null
}) {
  if (!item.data_reporte || item.sla_dias == null) return false

  const inicio = new Date(item.data_reporte).getTime()
  if (Number.isNaN(inicio)) return false

  const prazoMs = item.sla_dias * 24 * 60 * 60 * 1000
  const limite = inicio + prazoMs

  if (item.estado === 'Concluída' || item.estado === 'Encerrada') {
    if (!item.data_encerramento) return false

    const fim = new Date(item.data_encerramento).getTime()
    if (Number.isNaN(fim)) return false

    return fim > limite
  }

  return Date.now() > limite
}

const styles = {
  page: { padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' },
  header: { marginBottom: '24px' },
  title: { fontSize: '32px', fontWeight: 700 },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #ccc' },
  textarea: { padding: '10px', borderRadius: '8px', border: '1px solid #ccc' },
  btn: {
    padding: '10px 16px',
    borderRadius: '10px',
    backgroundColor: '#0f172a',
    color: '#fff',
    cursor: 'pointer',
  },
}

export default function EditOccurrencePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const id = String(params.id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [history, setHistory] = useState<HistoryItem[]>([])

  const [estado, setEstado] = useState('Em aberto')
  const [dataReporte, setDataReporte] = useState('')
  const [dataEstado, setDataEstado] = useState('')
  const [dataEncerramento, setDataEncerramento] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [slaDias, setSlaDias] = useState<number | null>(null)

  const [originalEstado, setOriginalEstado] = useState<string | null>(null)
  const [originalDataReporte, setOriginalDataReporte] = useState<string | null>(null)

  async function loadOccurrence() {
    const { data } = await supabase
      .from('occurrences')
      .select('*')
      .eq('id', id)
      .single()

    if (!data) return

    setEstado(data.estado)
    setDataReporte(toInputDate(data.data_reporte))
    setDataEstado(toInputDateTime(data.data_estado))
    setDataEncerramento(toInputDateTime(data.data_encerramento))
    setObservacoes(data.observacoes || '')
    setSlaDias(data.sla_dias)

    setOriginalEstado(data.estado)
    setOriginalDataReporte(data.data_reporte)

    setLoading(false)
  }

  async function loadHistory() {
    const { data } = await supabase
      .from('occurrence_history')
      .select('*')
      .eq('occurrence_id', id)
      .order('data_alteracao', { ascending: false })

    setHistory((data || []) as HistoryItem[])
  }

  useEffect(() => {
    loadOccurrence()
    loadHistory()
  }, [])

  const foraSlaAtual = useMemo(() => {
    return isForaSLA({
      data_reporte: fromInputDate(dataReporte) || originalDataReporte,
      data_encerramento: fromInputDateTime(dataEncerramento),
      sla_dias: slaDias,
      estado,
    })
  }, [dataReporte, dataEncerramento, slaDias, estado])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const dataEstadoIso = fromInputDateTime(dataEstado) || new Date().toISOString()

    let dataEncerramentoIso = fromInputDateTime(dataEncerramento)

    if (estado === 'Concluída' || estado === 'Encerrada') {
      if (!dataEncerramentoIso) {
        dataEncerramentoIso = dataEstadoIso
      }
    } else {
      dataEncerramentoIso = null
    }

    const foraSlaCalculado = isForaSLA({
      data_reporte: fromInputDate(dataReporte) || originalDataReporte,
      data_encerramento: dataEncerramentoIso,
      sla_dias: slaDias,
      estado,
    })

    await supabase
      .from('occurrences')
      .update({
        estado,
        data_estado: dataEstadoIso,
        data_encerramento: dataEncerramentoIso,
        observacoes,
        fora_sla: foraSlaCalculado,
      })
      .eq('id', id)

    if (originalEstado !== estado) {
      await supabase.from('occurrence_history').insert({
        occurrence_id: id,
        estado_anterior: originalEstado,
        estado_novo: estado,
        observacoes,
      })
    }

    setSaving(false)
    router.refresh()
  }

  if (loading) return <div style={styles.page}>A carregar...</div>

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Editar Ocorrência</h1>

      <form onSubmit={handleSave}>
        <div style={styles.card}>
          <div style={styles.grid}>
            <div style={styles.field}>
              <label>Estado</label>
              <select
                style={styles.input}
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                {estados.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label>SLA</label>
              <input
                style={styles.input}
                value={slaDias == null ? '-' : `${slaDias} dias`}
                readOnly
              />
            </div>

            <div style={styles.field}>
              <label>Situação SLA</label>
              <div>{foraSlaAtual ? 'Fora SLA' : 'Dentro SLA'}</div>
            </div>
          </div>

          <div style={styles.field}>
            <label>Observações</label>
            <textarea
              style={styles.textarea}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          <button style={styles.btn} disabled={saving}>
            Guardar
          </button>
        </div>
      </form>

      <div style={styles.card}>
        <h2>Histórico</h2>

        {history.map((h) => (
          <div key={h.id}>
            {formatDateTime(h.data_alteracao)} - {h.estado_anterior} → {h.estado_novo}
          </div>
        ))}
      </div>
    </div>
  )
}
