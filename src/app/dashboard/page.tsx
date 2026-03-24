'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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

export default function DashboardPage() {
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
      .order('data_estado', { ascending: false })
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

  const foraSla = 0

  const listaDashboard = rows.filter(
    (o) => o.estado !== 'Concluída' && o.estado !== 'Encerrada'
  )

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
        <h1>Dashboard</h1>

        <Link
          href="/dashboard/nova-ocorrencia"
          style={{
            backgroundColor: '#0f172a',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Nova Ocorrência
        </Link>
      </div>

      {errorMessage && (
        <p style={{ color: 'red', marginBottom: 16 }}>
          Erro ao carregar dashboard: {errorMessage}
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 16 }}>
          <h3>Total</h3>
          <p style={{ fontSize: 18, fontWeight: 'bold' }}>{total}</p>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 16 }}>
          <h3>Em aberto</h3>
          <p style={{ fontSize: 18, fontWeight: 'bold' }}>{emAberto}</p>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 16 }}>
          <h3>Concluídas</h3>
          <p style={{ fontSize: 18, fontWeight: 'bold' }}>{concluidas}</p>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 16 }}>
          <h3>Fora SLA</h3>
          <p style={{ fontSize: 18, fontWeight: 'bold' }}>{foraSla}</p>
        </div>
      </div>

      <h2>Ocorrências em aberto</h2>

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
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                  Ocorrência
                </th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                  Unidade
                </th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                  Categoria
                </th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                  Prioridade
                </th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                  Impacto
                </th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                  Estado
                </th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                  Data reporte
                </th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                  Observações
                </th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {listaDashboard.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      border: '1px solid #ddd',
                      padding: 8,
                      textAlign: 'center',
                    }}
                  >
                    Sem ocorrências em aberto
                  </td>
                </tr>
              ) : (
                listaDashboard.map((item) => (
                  <tr key={item.id}>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>
                      {item.ocorrencia || '-'}
                    </td>

                    <td style={{ border: '1px solid #ddd', padding: 8 }}>
                      {getUnitName(item.units, item.local_ocorrencia)}
                    </td>

                    <td style={{ border: '1px solid #ddd', padding: 8 }}>
                      {item.categoria || 'Sem categoria'}
                    </td>

                    <td style={{ border: '1px solid #ddd', padding: 8 }}>
                      {item.prioridade || '-'}
                    </td>

                    <td style={{ border: '1px solid #ddd', padding: 8 }}>
                      {item.impacto || '-'}
                    </td>

                    <td style={{ border: '1px solid #ddd', padding: 8 }}>
                      {item.estado || '-'}
                    </td>

                    <td style={{ border: '1px solid #ddd', padding: 8 }}>
                      {formatDate(item.data_reporte)}
                    </td>

                    <td style={{ border: '1px solid #ddd', padding: 8 }}>
                      {item.observacoes || '-'}
                    </td>

                    <td style={{ border: '1px solid #ddd', padding: 8 }}>
                      <Link
                        href={`/dashboard/ocorrencia/${item.id}`}
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#0f172a',
                          color: '#fff',
                          padding: '8px 12px',
                          borderRadius: 6,
                          textDecoration: 'none',
                        }}
                      >
                        Editar
                      </Link>
                    </td>
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
