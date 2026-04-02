'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import DashboardTopbar from '../../../components/dashboard/DashboardTopbar'

export default function ConcluidasPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase
      .from('occurrences')
      .select('*')
      .in('estado', ['Concluída', 'Encerrada'])

    setRows(data || [])
  }

  return (
    <div style={{ padding: 24 }}>
      <DashboardTopbar title="Ocorrências Concluídas" actions={[]} />

      {rows.map((item) => (
        <div key={item.id}>
          {item.ocorrencia}
        </div>
      ))}
    </div>
  )
}
