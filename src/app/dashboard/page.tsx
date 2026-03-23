import { createClient } from '@/lib/supabase/server'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: ocorrencias, error } = await supabase
    .from('occurrences')
    .select('*')

  if (error) {
    return <div>Erro ao carregar ocorrências: {error.message}</div>
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>
      <p>Total: {ocorrencias?.length || 0}</p>
    </div>
  )
}
