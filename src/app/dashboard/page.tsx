'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Occurrence = {
  id: string
  ocorrencia: string
  categoria: string | null
  prioridade: string | null
  impacto: string | null
  estado: string | null
  data_reporte: string | null
  data_estado: string | null
  data_encerramento: string | null
  observacoes: string | null
  units: { name: string } | null
}

export default function DashboardPage() {
  const [data, setData] = useState<Occurrence[]>([])
  const [filtroUnidade, setFiltroUnidade] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const supabase = createClient()

    const { data } = await supabase
      .from('occurrences')
      .select(`
        *,
        units(name)
      `)
      .order('data_reporte', { ascending: false })

    setData(data || [])
  }

  // ===== FILTROS =====
  const unidades = [...new Set(data.map(d => d.units?.name).filter(Boolean))]
  const categorias = [...new Set(data.map(d => d.categoria).filter(Boolean))]

  const filtrado = data.filter(d => {
    return (
      (!filtroUnidade || d.units?.name === filtroUnidade) &&
      (!filtroCategoria || d.categoria === filtroCategoria)
    )
  })

  const abertas = filtrado.filter(d => d.estado !== 'Concluída')
  const concluidas = filtrado.filter(d => d.estado === 'Concluída')
  const foraSLA = filtrado.filter(d => d.fora_sla === true)

  // ===== EXPORT CSV =====
  function exportCSV() {
    const headers = [
      'Ocorrência',
      'Unidade',
      'Categoria',
      'Prioridade',
      'Impacto',
      'Estado',
      'Data reporte',
      'Data estado',
      'Data fim',
      'Observações'
    ]

    const rows = data.map(d => [
      d.ocorrencia,
      d.units?.name || '',
      d.categoria || '',
      d.prioridade || '',
      d.impacto || '',
      d.estado || '',
      d.data_reporte || '',
      d.data_estado || '',
      d.data_encerramento || '',
      (d.observacoes || '').replace(/\n/g, ' ')
    ])

    const csv = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'ocorrencias.csv'
    link.click()
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>

      {/* ===== BOTÕES ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={exportCSV}>Exportar CSV</button>

          <Link href="/dashboard/concluidas">
            <button>Ver concluídas</button>
          </Link>

          <Link href="/dashboard/relatorios">
            <button>Relatórios</button>
          </Link>
        </div>

        <Link href="/dashboard/nova-ocorrencia">
          <button>Nova Ocorrência</button>
        </Link>
      </div>

      {/* ===== FILTROS ===== */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <select onChange={(e) => setFiltroUnidade(e.target.value)}>
          <option value="">Todas unidades</option>
          {unidades.map((u, i) => (
            <option key={i}>{u}</option>
          ))}
        </select>

        <select onChange={(e) => setFiltroCategoria(e.target.value)}>
          <option value="">Todas categorias</option>
          {categorias.map((c, i) => (
            <option key={i}>{c}</option>
          ))}
        </select>
      </div>

      {/* ===== KPIs ===== */}
      <div style={{ display: 'flex', gap: 20 }}>
        <div>Total: {filtrado.length}</div>
        <div>Em aberto: {abertas.length}</div>
        <div>Concluídas: {concluidas.length}</div>
        <div>Fora SLA: {foraSLA.length}</div>
      </div>

      {/* ===== TABELA ===== */}
      <h2 style={{ marginTop: 20 }}>Ocorrências</h2>

      <table border={1} cellPadding={5} style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th>Ocorrência</th>
            <th>Unidade</th>
            <th>Categoria</th>
            <th>Prioridade</th>
            <th>Impacto</th>
            <th>Estado</th>
            <th>Data reporte</th>
            <th>Observações</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filtrado.map(o => (
            <tr key={o.id}>
              <td>{o.ocorrencia}</td>
              <td>{o.units?.name}</td>
              <td>{o.categoria}</td>
              <td>{o.prioridade}</td>
              <td>{o.impacto}</td>
              <td>{o.estado}</td>
              <td>{o.data_reporte}</td>
              <td>{o.observacoes}</td>
              <td>
                <Link href={`/dashboard/ocorrencia/${o.id}`}>
                  <button>Editar</button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
