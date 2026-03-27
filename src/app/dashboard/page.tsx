'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
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
  fora_sla: boolean | null
  sla_dias: number | null
  units: UnitRelation
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-PT')
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('pt-PT')
}

function getUnitName(units: UnitRelation, fallback: string | null) {
  if (Array.isArray(units)) {
    return units[0]?.nome || fallback || '-'
  }
  return units?.nome || fallback || '-'
}

function isForaSLA(item: Occurrence) {
  if (!item.data_reporte || !item.sla_dias) return false

  if (item.estado === 'Concluída' || item.estado === 'Encerrada') {
    return false
  }

  const inicio = new Date(item.data_reporte).getTime()
  if (Number.isNaN(inicio)) return false

  const agora = Date.now()
  const diasPassados = (agora - inicio) / (1000 * 60 * 60 * 24)

  return diasPassados > item.sla_dias
}

function exportToCSV(lista: Occurrence[]) {
  const headers = [
    'Ocorrência',
    'Unidade',
    'Categoria',
    'Prioridade',
    'Impacto',
    'Estado',
    'Data reporte',
    'Data alteração estado',
    'Data fim',
    'SLA dias',
    'Fora SLA',
    'Observações',
  ]

  const rows = lista.map((item) => [
    item.ocorrencia || '',
    getUnitName(item.units, item.local_ocorrencia),
    item.categoria || '',
    item.prioridade || '',
    item.impacto || '',
    item.estado || '',
    formatDate(item.data_reporte),
    formatDateTime(item.data_estado),
    formatDateTime(item.data_encerramento),
    item.sla_dias ?? '',
    isForaSLA(item) ? 'Sim' : 'Não',
    item.observacoes || '',
  ])

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')
    )
    .join('\n')

  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'ocorrencias_dashboard.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function DashboardPage() {
  const supabase = createClient()

  const [rows, setRows] = useState<Occurrence[]>([])
  const [loading, setLoading] = useState(true)

  const [filtroUnidade, setFiltroUnidade] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [urlReady, setUrlReady] = useState(false)

  // 👉 Ler filtros da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setFiltroUnidade(params.get('unidade') || '')
    setFiltroCategoria(params.get('categoria') || '')
    setFiltroEstado(params.get('estado') || '')
    setUrlReady(true)
  }, [])

  // 👉 Atualizar URL
  useEffect(() => {
    if (!urlReady) return

    const params = new URLSearchParams()

    if (filtroUnidade) params.set('unidade', filtroUnidade)
    if (filtroCategoria) params.set('categoria', filtroCategoria)
    if (filtroEstado) params.set('estado', filtroEstado)

    const query = params.toString()
    const newUrl = query ? `/dashboard?${query}` : '/dashboard'
    window.history.replaceState({}, '', newUrl)
  }, [filtroUnidade, filtroCategoria, filtroEstado, urlReady])

  async function loadOccurrences() {
    setLoading(true)

    const { data } = await supabase
      .from('occurrences')
      .select(`
        *,
        units(nome)
      `)
      .order('data_reporte', { ascending: false })

    setRows((data || []) as Occurrence[])
    setLoading(false)
  }

  useEffect(() => {
    loadOccurrences()
  }, [])

  const total = rows.length

  const emAberto = rows.filter(
    (o) =>
      o.estado === 'Em aberto' ||
      o.estado === 'Em análise' ||
      o.estado === 'Em execução'
  ).length

  const concluidas = rows.filter(
    (o) => o.estado === 'Concluída' || o.estado === 'Encerrada'
  ).length

  const foraSla = rows.filter((o) => isForaSLA(o)).length

  const lista = rows.filter(
    (o) => o.estado !== 'Concluída' && o.estado !== 'Encerrada'
  )

  const listaFiltrada = lista.filter((item) => {
    const unidade = getUnitName(item.units, item.local_ocorrencia)

    return (
      (!filtroUnidade || unidade === filtroUnidade) &&
      (!filtroCategoria || item.categoria === filtroCategoria) &&
      (!filtroEstado || item.estado === filtroEstado)
    )
  })

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => exportToCSV(rows)}>Exportar CSV</button>
        <Link href="/dashboard/relatorios"> Relatórios </Link>
        <Link href="/dashboard/concluidas"> Concluídas </Link>
      </div>

      <div>
        <p>Total: {total}</p>
        <p>Em aberto: {emAberto}</p>
        <p>Concluídas: {concluidas}</p>
        <p>Fora SLA: {foraSla}</p>
      </div>

      {loading ? (
        <p>A carregar...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Ocorrência</th>
              <th>Unidade</th>
              <th>Estado</th>
              <th>SLA</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {listaFiltrada.map((item) => (
              <tr key={item.id}>
                <td>{item.ocorrencia}</td>
                <td>{getUnitName(item.units, item.local_ocorrencia)}</td>
                <td>{item.estado}</td>
                <td>
                  {isForaSLA(item) ? 'Fora SLA' : 'Dentro SLA'}
                </td>
                <td>
                  <Link href={`/dashboard/ocorrencia/${item.id}`}>
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
