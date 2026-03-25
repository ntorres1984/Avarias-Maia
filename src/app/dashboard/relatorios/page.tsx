'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Occurrence = {
  id: string
  ocorrencia: string
  categoria: string | null
  estado: string | null
  units: { name: string } | null
}

export default function RelatoriosPage() {
  const [data, setData] = useState<Occurrence[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const supabase = createClient()

    const { data } = await supabase
      .from('occurrences')
      .select('id, ocorrencia, categoria, estado, units(name)')

    setData(data || [])
  }

  const total = data.length
  const abertas = data.filter(d => d.estado !== 'Concluída').length
  const concluidas = data.filter(d => d.estado === 'Concluída').length

  // ===== AGRUPAMENTO POR UNIDADE =====
  const unidades: any = {}

  data.forEach(o => {
    const unidade = o.units?.name || 'Sem unidade'

    if (!unidades[unidade]) {
      unidades[unidade] = {
        total: 0,
        abertas: 0,
        analise: 0,
        execucao: 0,
        concluidas: 0,
        encerradas: 0
      }
    }

    unidades[unidade].total++

    if (o.estado === 'Em análise') unidades[unidade].analise++
    else if (o.estado === 'Em execução') unidades[unidade].execucao++
    else if (o.estado === 'Concluída') unidades[unidade].concluidas++
    else if (o.estado === 'Encerrada') unidades[unidade].encerradas++
    else unidades[unidade].abertas++
  })

  // ===== AGRUPAMENTO POR CATEGORIA =====
  const categorias: any = {}

  data.forEach(o => {
    const cat = o.categoria || 'Sem categoria'

    if (!categorias[cat]) {
      categorias[cat] = {
        total: 0,
        abertas: 0,
        analise: 0,
        execucao: 0,
        concluidas: 0,
        encerradas: 0
      }
    }

    categorias[cat].total++

    if (o.estado === 'Em análise') categorias[cat].analise++
    else if (o.estado === 'Em execução') categorias[cat].execucao++
    else if (o.estado === 'Concluída') categorias[cat].concluidas++
    else if (o.estado === 'Encerrada') categorias[cat].encerradas++
    else categorias[cat].abertas++
  })

  // ===== EXPORT CSV =====
  function exportCSV(obj: any, nome: string) {
    const headers = ['Nome', 'Total', 'Em aberto', 'Em análise', 'Em execução', 'Concluídas', 'Encerradas']

    const rows = Object.entries(obj).map(([key, val]: any) => [
      key,
      val.total,
      val.abertas,
      val.analise,
      val.execucao,
      val.concluidas,
      val.encerradas
    ])

    const csv = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = nome
    link.click()
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Relatórios de gestão</h1>

      <Link href="/dashboard">← Voltar ao dashboard</Link>

      <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
        <div>Total: {total}</div>
        <div>Abertas: {abertas}</div>
        <div>Concluídas: {concluidas}</div>
      </div>

      <h2 style={{ marginTop: 30 }}>Resumo por unidade</h2>
      <button onClick={() => exportCSV(unidades, 'unidades.csv')}>
        Exportar unidades CSV
      </button>

      <table border={1} cellPadding={5}>
        <thead>
          <tr>
            <th>Unidade</th>
            <th>Total</th>
            <th>Em aberto</th>
            <th>Em análise</th>
            <th>Em execução</th>
            <th>Concluídas</th>
            <th>Encerradas</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(unidades).map(([key, val]: any) => (
            <tr key={key}>
              <td>{key}</td>
              <td>{val.total}</td>
              <td>{val.abertas}</td>
              <td>{val.analise}</td>
              <td>{val.execucao}</td>
              <td>{val.concluidas}</td>
              <td>{val.encerradas}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: 30 }}>Resumo por categoria</h2>
      <button onClick={() => exportCSV(categorias, 'categorias.csv')}>
        Exportar categorias CSV
      </button>

      <table border={1} cellPadding={5}>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Total</th>
            <th>Em aberto</th>
            <th>Em análise</th>
            <th>Em execução</th>
            <th>Concluídas</th>
            <th>Encerradas</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(categorias).map(([key, val]: any) => (
            <tr key={key}>
              <td>{key}</td>
              <td>{val.total}</td>
              <td>{val.abertas}</td>
              <td>{val.analise}</td>
              <td>{val.execucao}</td>
              <td>{val.concluidas}</td>
              <td>{val.encerradas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
