import { createClient } from '@/lib/supabase/server'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: occurrences, error } = await supabase
    .from('occurrences')
    .select('*')

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>
      <p>Total: {occurrences?.length || 0}</p>
      <pre>{JSON.stringify({ occurrences, error }, null, 2)}</pre>
    </div>
  )
}
