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
  created_at?: string | null
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

function toDateTimeLocal(dateString: string | null) {
  if (!dateString) return ''

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''

  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60000)

  return localDate.toISOString().slice(0, 16)
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
    const observacoes = String(formData.get('observacoes') || '').trim()
    const dataEstadoInput = String(formData.get('data_estado') || '').trim()
    const dataFimInput = String(formData.get('data_encerramento') || '').trim()

    let dataEstado = dataEstadoInput
      ? new Date(dataEstadoInput).toISOString()
      : new Date().toISOString()

    let dataEncerramento: string | null = dataFimInput
      ? new Date(dataFimInput).toISOString()
      : null

    if ((estado === 'Concluída' || estado === 'Encerrada') && !dataEncerramento) {
      dataEncerramento = dataEstado
    }

    if (estado === 'Em aberto' || estado === 'Em execução') {
      dataEncerramento = null
    }

    const updateData = {
      estado,
      observacoes: observacoes || null,
      data_estado: dataEstado,
      data_encerramento: dataEncerramento,
    }

    const { error } = await supabase
      .from('occurrences')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar ocorrência:', error.message)
    }

    revalidatePath('/dashboard')
  }

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
      created_at,
      units (
        nome
      )
    `)
    .order('data_reporte', { ascending: false })
    .order('data_estado', { ascending: false })

  const lista: Occurrence[] = data || []

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
                Data alteração estado
              </th>
              <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                Data fim
              </th>
              <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                Observações
              </th>
              <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>
                Guardar
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
              lista.map((item) => {
                const formId = `form-${item.id}`

                return (
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
                      <form id={formId} action={updateOccurrence}>
                        <input type="hidden" name="id" value={item.id} />
                      </form>

                      <select
                        name="estado"
                        form={formId}
                        defaultValue={item.estado || 'Em aberto'}
                      >
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
                      <input
                        type="datetime-local"
                        name="data_estado"
                        form={formId}
                        defaultValue={toDateTimeLocal(item.data_estado)}
                      />
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        Atual: {formatDateTime(item.data_estado)}
                      </div>
                    </td>

                    <td style={{ border: '1px solid #ddd', padding: 8 }}>
                      <input
                        type="datetime-local"
                        name="data_encerramento"
                        form={formId}
                        defaultValue={toDateTimeLocal(item.data_encerramento)}
                      />
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        Atual: {formatDateTime(item.data_encerramento)}
                      </div>
                    </td>

                    <td style={{ border: '1px solid #ddd', padding: 8 }}>
                      <textarea
                        name="observacoes"
                        form={formId}
                        defaultValue={item.observacoes || ''}
                        rows={3}
                        style={{ minWidth: 220 }}
                      />
                    </td>

                    <td style={{ border: '1px solid #ddd', padding: 8 }}>
                      <button type="submit" form={formId}>
                        Guardar
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
