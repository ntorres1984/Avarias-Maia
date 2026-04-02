'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardTopbar from '@/components/dashboard/DashboardTopbar'

type Occurrence = {
  id: string
  ocorrencia: string | null
  categoria: string | null
  prioridade: string | null
  estado: string | null
  fora_sla: boolean | null
  data_reporte: string | null
  data_encerramento: string | null
}

export default function RelatoriosPage() {
  const supabase = createClient()

  const [rows, setRows] = useState<Occurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    void fetchRows()
  }, [])

  async function fetchRows() {
    setLoading(true)
    setErrorMsg(null)

    const { data, error } = await supabase
      .from('occurrences')
      .select(
        'id, ocorrencia, categoria, prioridade, estado, fora_sla, data_reporte, data_encerramento'
      )
      .order('data_reporte', { ascending: false })

    if (error) {
      setErrorMsg(error.message)
      setRows([])
    } else {
      setRows(data || [])
    }

    setLoading(false)
  }

  const stats = useMemo(() => {
    const total = rows.length
    const abertas = rows.filter((r) => r.estado !== 'Encerrada').length
    const encerradas = rows.filter((r) => r.estado === 'Encerrada').length
    const foraSla = rows.filter((r) => r.fora_sla === true).length

    return { total, abertas, encerradas, foraSla }
  }, [rows])

  return (
    <div className="p-6">
      <DashboardTopbar
        title="Relatórios"
        subtitle="Resumo geral das ocorrências"
      />

      {errorMsg ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Total</div>
          <div className="mt-2 text-2xl font-semibold text-slate-800">
            {stats.total}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Abertas</div>
          <div className="mt-2 text-2xl font-semibold text-slate-800">
            {stats.abertas}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Encerradas</div>
          <div className="mt-2 text-2xl font-semibold text-slate-800">
            {stats.encerradas}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Fora de prazo</div>
          <div className="mt-2 text-2xl font-semibold text-slate-800">
            {stats.foraSla}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Ocorrência</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Prioridade</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Prazo</th>
                <th className="px-4 py-3">Data reporte</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    A carregar...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    Sem dados.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{row.ocorrencia || '—'}</td>
                    <td className="px-4 py-3">{row.categoria || '—'}</td>
                    <td className="px-4 py-3">{row.prioridade || '—'}</td>
                    <td className="px-4 py-3">{row.estado || '—'}</td>
                    <td className="px-4 py-3">
                      {row.fora_sla ? 'Fora de prazo' : 'Dentro do prazo'}
                    </td>
                    <td className="px-4 py-3">
                      {row.data_reporte
                        ? new Date(row.data_reporte).toLocaleDateString('pt-PT')
                        : '—'}
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
