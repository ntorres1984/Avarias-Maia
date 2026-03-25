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

type UnitSummary = {
  unidade: string
  total: number
  emAberto: number
  emAnalise: number
  emExecucao: number
  concluidas: number
  encerradas: number
}

type CategorySummary = {
  categoria: string
  total: number
  emAberto: number
  emAnalise: number
  emExecucao: number
  concluidas: number
  encerradas: number
}

function getUnitName(units: UnitRelation, fallback: string | null) {
  if (Array.isArray(units)) {
    return units[0]?.nome || fallback || '-'
  }

  return units?.nome || fallback || '-'
}

function normalizeCategoria(value: string | null) {
  return value || 'Sem categoria'
}

function exportUnitsCSV(lista: UnitSummary[]) {
  const headers = [
    'Unidade',
    'Total',
    'Em aberto',
    'Em análise',
    'Em execução',
    'Concluídas',
    'Encerradas',
  ]

  const rows = lista.map((item) => [
    item.unidade,
    item.total,
    item.emAberto,
    item.emAnalise,
    item.emExecucao,
    item.concluidas,
    item.encerradas,
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
  link.setAttribute('download', 'relatorio_unidades.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function exportCategoriesCSV(lista: CategorySummary[]) {
  const headers = [
    'Categoria',
    'Total',
    'Em aberto',
    'Em análise',
    'Em execução',
    'Concluídas',
    'Encerradas',
  ]

  const rows = lista.map((item) => [
    item.categoria,
    item.total,
    item.emAberto,
    item.emAnalise,
    item.emExecucao,
    item.concluidas,
    item.encerradas,
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
  link.setAttribute('download', 'relatorio_categorias.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function RelatoriosPage() {
  const supabase = createClient()

  const [rows, setRows] = useState<Occurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

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
      .order('data_reporte', { ascending: false })

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

  const resumoPorUnidade = useMemo(() => {
    const map = new Map<string, UnitSummary>()

    rows.forEach((item) => {
      const unidade = getUnitName(item.units, item.local_ocorrencia)
      const estado = item.estado || '-'

      if (!map.has(unidade)) {
        map.set(unidade, {
          unidade,
          total: 0,
          emAberto: 0,
          emAnalise: 0,
          emExecucao: 0,
          concluidas: 0,
          encerradas: 0,
        })
      }

      const current = map.get(unidade)!
      current.total += 1

      if (estado === 'Em aberto') current.emAberto += 1
      if (estado === 'Em análise') current.emAnalise += 1
      if (estado === 'Em execução') current.emExecucao += 1
      if (estado === 'Concluída') current.concluidas += 1
      if (estado === 'Encerrada') current.encerradas += 1
    })

    return Array.from(map.values()).sort((a, b) =>
      a.unidade.localeCompare(b.unidade)
    )
  }, [rows])

  const resumoPorCategoria = useMemo(() => {
    const map = new Map<string, CategorySummary>()

    rows.forEach((item) => {
      const categoria = normalizeCategoria(item.categoria)
      const estado = item.estado || '-'

      if (!map.has(categoria)) {
        map.set(categoria, {
          categoria,
          total: 0,
          emAberto: 0,
          emAnalise: 0,
          emExecucao: 0,
          concluidas: 0,
          encerradas: 0,
        })
      }

      const current = map.get(categoria)!
      current.total += 1

      if (estado === 'Em aberto') current.emAberto += 1
      if (estado === 'Em análise') current.emAnalise += 1
      if (estado === 'Em execução') current.emExecucao += 1
      if (estado === 'Concluída') current.concluidas += 1
      if (estado === 'Encerrada') current.encerradas += 1
    })

    return Array.from(map.values()).sort((a, b) =>
      a.categoria.localeCompare(b.categoria)
    )
  }, [rows])

  const total = rows.length
  const totalConcluidas = rows.filter(
    (o) => o.estado === 'Concluída' || o.estado === 'Encerrada'
  ).length
  const totalAbertas = rows.filter(
    (o) =>
      o.estado === 'Em aberto' ||
      o.estado === 'Em análise' ||
      o.estado === 'Em execução'
  ).length

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
          <h1>Relatórios de gestão</h1>
          <Link href="/dashboard">← Voltar ao dashboard</Link>
        </div>
      </div>

      {errorMessage && (
        <p style={{ color: 'red', marginBottom: 16 }}>
          Erro ao carregar relatórios: {errorMessage}
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 16 }}>
          <h3>Total de ocorrências</h3>
          <p style={{ fontSize: 18, fontWeight: 'bold' }}>{total}</p>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 16 }}>
          <h3>Ocorrências abertas</h3>
          <p style={{ fontSize: 18, fontWeight: 'bold' }}>{totalAbertas}</p>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 16 }}>
          <h3>Ocorrências concluídas</h3>
          <p style={{ fontSize: 18, fontWeight: 'bold' }}>{totalConcluidas}</p>
        </div>
      </div>

      {loading ? (
        <p>A carregar...</p>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 24,
              marginBottom: 12,
            }}
          >
            <h2>Resumo por unidade</h2>
            <button onClick={() => exportUnitsCSV(resumoPorUnidade)}>
              Exportar unidades CSV
            </button>
          </div>

          <div style={{ overflowX: 'auto', marginBottom: 32 }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Unidade</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Total</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Em aberto</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Em análise</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Em execução</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Concluídas</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Encerradas</th>
                </tr>
              </thead>
              <tbody>
                {resumoPorUnidade.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        border: '1px solid #ddd',
                        padding: 8,
                        textAlign: 'center',
                      }}
                    >
                      Sem dados
                    </td>
                  </tr>
                ) : (
                  resumoPorUnidade.map((item) => (
                    <tr key={item.unidade}>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.unidade}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.total}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.emAberto}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.emAnalise}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.emExecucao}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.concluidas}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.encerradas}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 24,
              marginBottom: 12,
            }}
          >
            <h2>Resumo por categoria</h2>
            <button onClick={() => exportCategoriesCSV(resumoPorCategoria)}>
              Exportar categorias CSV
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Categoria</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Total</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Em aberto</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Em análise</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Em execução</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Concluídas</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Encerradas</th>
                </tr>
              </thead>
              <tbody>
                {resumoPorCategoria.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        border: '1px solid #ddd',
                        padding: 8,
                        textAlign: 'center',
                      }}
                    >
                      Sem dados
                    </td>
                  </tr>
                ) : (
                  resumoPorCategoria.map((item) => (
                    <tr key={item.categoria}>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.categoria}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.total}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.emAberto}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.emAnalise}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.emExecucao}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.concluidas}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.encerradas}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
