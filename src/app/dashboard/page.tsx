import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: occurrences, error } = await supabase
    .from('occurrences')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return <div>Erro ao carregar ocorrências: {error.message}</div>
  }

  const total = occurrences?.length || 0

  const emAberto =
    occurrences?.filter((o) =>
      ['Em aberto', 'Registada', 'Em análise', 'Em execução'].includes(o.estado)
    ).length || 0

  const concluidas =
    occurrences?.filter((o) =>
      ['Concluída', 'Concluidas', 'Resolvida', 'Encerrada'].includes(o.estado)
    ).length || 0

  const foraSla =
    occurrences?.filter((o) => o.fora_sla === true).length || 0

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h1>Dashboard</h1>

        <Link
          href="/dashboard/nova-ocorrencia"
          style={{
            padding: '10px 16px',
            background: '#0f172a',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: 8,
            fontWeight: 'bold',
          }}
        >
          Nova Ocorrência
        </Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginTop: 20,
        }}
      >
        <div style={{ padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
          <h3>Total</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold' }}>{total}</p>
        </div>

        <div style={{ padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
          <h3>Em aberto</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold' }}>{emAberto}</p>
        </div>

        <div style={{ padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
          <h3>Concluídas</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold' }}>{concluidas}</p>
        </div>

        <div style={{ padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
          <h3>Fora SLA</h3>
          <p style={{ fontSize: 28, fontWeight: 'bold' }}>{foraSla}</p>
        </div>
      </div>

      <div style={{ marginTop: 30 }}>
        <h2>Últimas ocorrências</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Ocorrência</th>
              <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Categoria</th>
              <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Estado</th>
              <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Data</th>
            </tr>
          </thead>
          <tbody>
            {occurrences?.map((o) => (
              <tr key={o.id}>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>
                  {o.ocorrencia || '-'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>
                  {o.categoria || 'Sem categoria'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      background:
                        o.estado === 'Em aberto'
                          ? '#ffeeba'
                          : o.estado === 'Concluída' || o.estado === 'Encerrada'
                          ? '#c3e6cb'
                          : '#e2e3e5',
                    }}
                  >
                    {o.estado || '-'}
                  </span>
                </td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>
                  {o.data_reporte
                    ? new Date(o.data_reporte).toLocaleDateString('pt-PT')
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
