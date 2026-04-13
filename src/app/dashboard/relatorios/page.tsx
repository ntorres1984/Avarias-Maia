'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import DashboardTopbar from '../../../components/dashboard/DashboardTopbar'

type UnitRelation =
  | { nome: string | null }
  | { nome: string | null }[]
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
  data_encerramento: string | null
  observacoes: string | null
  sla_dias: number | null
  units: UnitRelation
}

type Profile = {
  id: string
  nome: string | null
  email: string | null
  role: string | null
  ativo: boolean | null
}

function getUnitName(units: UnitRelation, fallback: string | null) {
  if (Array.isArray(units)) return units[0]?.nome || fallback || '-'
  return units?.nome || fallback || '-'
}

function getForaPrazoValue(item: Occurrence) {
  if (!item.data_reporte || item.sla_dias == null) return false

  const inicio = new Date(item.data_reporte).getTime()
  if (Number.isNaN(inicio)) return false

  const limite = inicio + item.sla_dias * 24 * 60 * 60 * 1000

  const referencia =
    item.estado === 'Concluída' || item.estado === 'Encerrada'
      ? item.data_encerramento
        ? new Date(item.data_encerramento).getTime()
        : Date.now()
      : Date.now()

  if (Number.isNaN(referencia)) return false

  return referencia > limite
}

export default function RelatoriosPage() {
  const supabase = createClient()
  const router = useRouter()

  const [rows, setRows] = useState<Occurrence[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(profileData)

    const { data } = await supabase
      .from('occurrences')
      .select(`
        *,
        units ( nome )
      `)
      .order('data_reporte', { ascending: false })

    setRows(data || [])
    setLoading(false)
  }

  // 🔥 CORREÇÃO SLA
  const ocorrenciasComSLA = rows.filter((o) => o.sla_dias != null)

  const foraPrazo = ocorrenciasComSLA.filter((o) =>
    getForaPrazoValue(o)
  ).length

  const dentroPrazo = ocorrenciasComSLA.filter(
    (o) => !getForaPrazoValue(o)
  ).length

  const total = rows.length

  const abertas = rows.filter(
    (o) =>
      o.estado === 'Em aberto' ||
      o.estado === 'Em análise' ||
      o.estado === 'Em execução'
  ).length

  const concluidas = rows.filter(
    (o) => o.estado === 'Concluída' || o.estado === 'Encerrada'
  ).length

  if (loading) return <div>A carregar...</div>

  return (
    <div style={{ padding: 24 }}>
      <DashboardTopbar
        title="Relatórios de gestão"
        subtitle="Visão global"
        userName={profile?.nome || undefined}
        userEmail={profile?.email || undefined}
        avatarUrl={(profile as any)?.avatar_url || null}
        actions={[
          {
            label: 'Voltar ao dashboard',
            href: '/dashboard',
          },
        ]}
      />

      <h2>Total: {total}</h2>
      <h2>Abertas: {abertas}</h2>
      <h2>Concluídas: {concluidas}</h2>

      <h2 style={{ color: 'red' }}>
        Fora do prazo: {foraPrazo}
      </h2>

      <h2 style={{ color: 'green' }}>
        Dentro do prazo: {dentroPrazo}
      </h2>
    </div>
  )
}
