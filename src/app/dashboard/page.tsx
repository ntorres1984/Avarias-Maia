import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

export default async function DashboardPage() {
  const supabase = createClient()

  async function updateOccurrence(formData: FormData) {
    'use server'

    const supabase = createClient()

    const id = String(formData.get('id') || '')
    const estado = String(formData.get('estado') || '')
    const observacoes = String(formData.get('observacoes') || '')

    const agora = new Date().toISOString()

    const updateData: {
      estado: string
      observacoes: string
      data_estado: string
      data_encerramento: string | null
    } = {
      estado,
      observacoes,
      data_estado: agora,
      data_encerramento: null,
    }

    if (estado === 'Concluída' || estado === 'Encerrada') {
      updateData.data_encerramento = agora
    }

    await supabase.from('occurrences').update(updateData).eq('id', id)

    revalidatePath('/dashboard')
  }

  const { data: occurrences, error } = await supabase
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

  const lista: Occurrence[] = occurrences || []

  const total = lista.length
  const emAberto = lista.filter(
    (o) => o.estado === 'Em aberto' || o.estado === 'Em execução'
  ).length
  const concluidas = lista.filter(
    (o) => o.estado === 'Concluída' || o.estado === 'Encerrada'
  ).length
  const foraSla = 0

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
                Data reporte
              </th>
              <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                Data estado
              </th>
              <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                Data fim
              </th>
              <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                Observações
              </th>
              <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                Ação
              </th>
            </tr>
          </thead>

          <tbody>
            {lista.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  style={{
                    border: '1px solid #ddd',
                    padding: 8,
                    textAlign: 'center',
                  }}
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

                  <td style={{ border: '1px solid #ddd', padding: 8, verticalAlign: 'top' }}>
                    <form action={updateOccurrence} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input type="hidden" name="id" value={item.id} />

                      <select name="estado" defaultValue={item.estado || 'Em aberto'}>
                        <option value="Em aberto">Em aberto</option>
                        <option value="Em execução">Em execução</option>
                        <option value="Concluída">Concluída</option>
                        <option value="Encerrada">Encerrada</option>
                      </select>
                  </td>

                  <td style={{ border: '1px solid #ddd', padding: 8 }}>
                    {formatDate(item.data_reporte)}
                  </td>

                  <td style={{ border: '1px solid #ddd', padding: 8 }}>
                    {formatDate(item.data_estado)}
                  </td>

                  <td style={{ border: '1px solid #ddd', padding: 8 }}>
                    {formatDate(item.data_encerramento)}
                  </td>

                  <td style={{ border: '1px solid #ddd', padding: 8, verticalAlign: 'top' }}>
                      <textarea
                        name="observacoes"
                        defaultValue={item.observacoes || ''}
                        rows={3}
                        style={{ minWidth: 180 }}
                      />
                  </td>

                  <td style={{ border: '1px solid #ddd', padding: 8, verticalAlign: 'top' }}>
                      <button type="submit">Guardar</button>
                    </form>
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
