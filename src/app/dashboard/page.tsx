export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Occurrence = {
  id: string
  ocorrencia: string | null
  local_ocorrencia: string | null
  categoria: string | null
  prioridade: string | null
  impacto: string | null
  estado: string | null
  data_reporte: string | null
  units?: { nome: string } | null
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-'

  const date = new Date(dateString)
  return date.toLocaleDateString('pt-PT')
}

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: occurrences, error } = await supabase
    .from('occurrences')
    .select(`
      *,
      units (
        nome
      )
    `)
    .order('data_reporte', { ascending: false })

  const lista: Occurrence[] = occurrences ?? []

  const total = lista.length
  const emAberto = lista.filter((o) => o.estado === 'Em aberto').length
  const concluidas = lista.filter(
    (o) => o.estado === 'Concluída' || o.estado === 'Concluida'
  ).length
  const foraSla = lista.filter((o) => o.estado === 'Fora SLA').length

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

      {error && (
        <p style={{ color: 'red', marginBottom: 16 }}>
          Erro ao carregar dashboard: {error.message}
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

      <h2>Últimas ocorrências</h2>

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
                Data
              </th>
            </tr>
          </thead>

          <tbody>
            {lista.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}
                >
                  Sem ocorrências registadas
                </td>
              </tr>
            ) : (
              lista.map((item) => (
                <tr key={item.id}>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>
                    {item.ocorrencia || '-'}
                  </td>

                  <td style={{ border: '1px solid #ddd', padding: 8 }}>
                    {item.units?.nome || item.local_ocorrencia || '-'}
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
