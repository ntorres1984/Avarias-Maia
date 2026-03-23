import { createClient } from '@/lib/supabase/server'

export default async function Dashboard() {
  const supabase = createClient()

  const { data: ocorrencias } = await supabase
    .from('ocorrencias')
    .select('*')

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>

      <p>Total: {ocorrencias?.length || 0}</p>
    </div>
  )
}
