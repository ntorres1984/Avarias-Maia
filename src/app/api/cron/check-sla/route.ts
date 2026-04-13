import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// 👉 Tipagem correta (resolve o erro do "never")
type OccurrenceWithUnit = {
  id: string
  ocorrencia: string | null
  local_ocorrencia: string | null
  categoria: string | null
  prioridade: string | null
  impacto: string | null
  estado: string | null
  data_reporte: string | null
  sla_dias: number | null
  created_by_email: string | null
  sla_alert_sent_at: string | null
  units:
    | { nome: string | null }
    | { nome: string | null }[]
    | null
}

export async function GET(req: Request) {
  try {
    // 🔐 proteção do cron
    const authHeader = req.headers.get('authorization')

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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
        sla_dias,
        created_by_email,
        sla_alert_sent_at,
        units ( nome )
      `)
      .returns<OccurrenceWithUnit[]>()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let emailsSent = 0

    for (const item of data || []) {
      if (!item.data_reporte || item.sla_dias == null) continue
      if (item.sla_alert_sent_at) continue

      const inicio = new Date(item.data_reporte).getTime()
      const agora = Date.now()

      const dias = (agora - inicio) / (1000 * 60 * 60 * 24)

      if (dias <= item.sla_dias) continue

      // 👉 resolver unidade (SEM erro TS)
      let unitName = '-'

      if (Array.isArray(item.units)) {
        unitName = item.units[0]?.nome || item.local_ocorrencia || '-'
      } else if (item.units) {
        unitName = item.units.nome || item.local_ocorrencia || '-'
      } else {
        unitName = item.local_ocorrencia || '-'
      }

      const link = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/ocorrencia/${item.id}`

      if (item.created_by_email) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: item.created_by_email,
          subject: '⚠️ Ocorrência fora do prazo',
          html: `
            <h2>Ocorrência fora do prazo</h2>
            <p><strong>${item.ocorrencia}</strong></p>
            <p>Unidade: ${unitName}</p>
            <p>Já ultrapassou o prazo de resolução definido.</p>
            <a href="${link}">Ver ocorrência</a>
          `,
        })

        emailsSent++

        // marcar como já notificado
        await supabase
          .from('occurrences')
          .update({
            sla_alert_sent_at: new Date().toISOString(),
          })
          .eq('id', item.id)
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
