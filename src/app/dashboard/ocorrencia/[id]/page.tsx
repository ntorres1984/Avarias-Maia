'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardTopbar from '@/components/dashboard/DashboardTopbar'

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
}

export default function OcorrenciaDetalhePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [row, setRow] = useState<Occurrence | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (params?.id) {
      void fetchOccurrence(params.id)
    }
  }, [params?.id])

  async function fetchOccurrence(id: string) {
    setLoading(true)
    setErrorMsg(null)

    const { data, error } = await supabase
      .from('occurrences')
      .select(
        'id, ocorrencia, local_ocorrencia, categoria, prioridade, impacto, estado, data_reporte, data_estado, data_encerramento, observacoes'
      )
      .eq('id', id)
      .single()

    if (error) {
      setErrorMsg(error.message)
      setRow(null)
    } else {
      setRow(data)
    }

    setLoading(false)
  }

  async function saveChanges() {
    if (!row) return

    setSaving(true)
    setErrorMsg(null)

    const { error } = await supabase
      .from('occurrences')
      .update({
        ocorrencia: row.ocorrencia,
        local_ocorrencia: row.local_ocorrencia,
        categoria: row.categoria,
        prioridade: row.prioridade,
        impacto: row.impacto,
        estado: row.estado,
        observacoes: row.observacoes,
        data_estado: new Date().toISOString(),
        data_encerramento:
          row.estado === 'Encerrada'
            ? row.data_encerramento || new Date().toISOString()
            : null,
      })
      .eq('id', row.id)

    if (error) {
      setErrorMsg(error.message)
    } else {
      await fetchOccurrence(row.id)
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-6">
        <DashboardTopbar title="Ocorrência" />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          A carregar...
        </div>
      </div>
    )
  }

  if (!row) {
    return (
      <div className="p-6">
        <DashboardTopbar title="Ocorrência" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
          Ocorrência não encontrada.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <DashboardTopbar
        title="Detalhe da ocorrência"
        subtitle={row.ocorrencia || undefined}
      />

      {errorMsg ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Ocorrência
            </label>
            <input
              value={row.ocorrencia || ''}
              onChange={(e) =>
                setRow({ ...row, ocorrencia: e.target.value || null })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Local
            </label>
            <input
              value={row.local_ocorrencia || ''}
              onChange={(e) =>
                setRow({ ...row, local_ocorrencia: e.target.value || null })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Categoria
            </label>
            <input
              value={row.categoria || ''}
              onChange={(e) =>
                setRow({ ...row, categoria: e.target.value || null })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Prioridade
            </label>
            <input
              value={row.prioridade || ''}
              onChange={(e) =>
                setRow({ ...row, prioridade: e.target.value || null })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Impacto
            </label>
            <input
              value={row.impacto || ''}
              onChange={(e) =>
                setRow({ ...row, impacto: e.target.value || null })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Estado
            </label>
            <select
              value={row.estado || ''}
              onChange={(e) => setRow({ ...row, estado: e.target.value || null })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            >
              <option value="">Selecionar</option>
              <option value="Aberta">Aberta</option>
              <option value="Em análise">Em análise</option>
              <option value="Em execução">Em execução</option>
              <option value="Resolvida">Resolvida</option>
              <option value="Encerrada">Encerrada</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Observações
            </label>
            <textarea
              value={row.observacoes || ''}
              onChange={(e) =>
                setRow({ ...row, observacoes: e.target.value || null })
              }
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => void saveChanges()}
            disabled={saving}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'A guardar...' : 'Guardar alterações'}
          </button>

          <button
            onClick={() => router.back()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
