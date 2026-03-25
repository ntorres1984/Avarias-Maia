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
  units: UnitRelation
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-PT')
}

function getUnitName(units: UnitRelation, fallback: string | null) {
  if (Array.isArray(units)) {
    return units[0]?.nome || fallback || '-'
  }
  return units?.nome || fallback || '-'
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
    'Observações',
  ]

  const rows = lista.map((item) => [
    item.ocorrencia || '',
    getUnitName(item.units, item.local_ocorrencia),
    item.categoria || '',
    item.prioridade || '',
    item.impacto || '',
    item.estado || '',
    item.data_reporte || '',
    item.data_estado || '',
    item.data_encerramento || '',
    item.observacoes || '',
  ])

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')
    )
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'ocorrencias_concluidas.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function ConcluidasPage() {
  const supabase = createClient()

  const [rows, setRows] = useState<Occurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [filtroUnidade, setFiltroUnidade] = useState('')

  async function loadOccurrences() {
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
      .in('estado', ['Concluída', 'Encerrada'])
      .order('data_encerramento', { ascending: false })
      .order('data_estado', { ascending: false })

    if (error) {
      setErrorMessage(error.message)
      setRows([])
      setLoading(false)
      return
    }

    setRows((data || []) as Occurrence[])
    setLoading(false)
  }

  useEffect(() => {
    loadOccurrences()
  }, [])

  const unidades = useMemo(() => {
    const values = rows.map((item) => getUnitName(item.units, item.local_ocorrencia))
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const listaFiltrada = useMemo(() => {
    return rows.filter((item) => {
      const unidade = getUnitName(item.units, item.local_ocorrencia)
      return !filtroUnidade || unidade === filtroUnidade
    })
  }, [rows, filtroUnidade])

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1>Ocorrências concluídas</h1>
          <Link href="/dashboard">← Voltar ao dashboard</Link>
        </div>

        <button onClick={() => exportToCSV(listaFiltrada)}>
          Exportar CSV
        </button>
      </div>

      {errorMessage && (
        <p style={{ color: 'red', marginBottom: 16 }}>
          Erro ao carregar: {errorMessage}
        </p>
      )}

      <div style={{ marginBottom: 16 }}>
        <label>Filtrar por unidade: </label>
        <select
          value={filtroUnidade}
          onChange={(e) => setFiltroUnidade(e.target.value)}
        >
          <option value="">Todas</option>
          {unidades.map((unidade) => (
            <option key={unidade} value={unidade}>
              {unidade}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>A carregar...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: 12,
            }}
          >
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Ocorrência</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Unidade</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Categoria</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Prioridade</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Impacto</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Estado</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Data reporte</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Data alteração estado</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Data fim</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Observações</th>
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>
                    Sem ocorrências concluídas
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((item) => (
                  <tr key={item.id}>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.ocorrencia || '-'}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{getUnitName(item.units, item.local_ocorrencia)}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.categoria || 'Sem categoria'}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.prioridade || '-'}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.impacto || '-'}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.estado || '-'}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{formatDate(item.data_reporte)}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{formatDate(item.data_estado)}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{formatDate(item.data_encerramento)}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.observacoes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
