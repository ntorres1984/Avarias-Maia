import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function parseDateSafe(dateString: string | null) {
  if (!dateString) return null
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function isClosedEstado(estado: string | null) {
  const normalized = (estado || '').trim().toLowerCase()
  return (
    normalized === 'concluída' ||
    normalized === 'concluida' ||
    normalized === 'encerrada' ||
    normalized === 'resolvida'
  )
}

function isForaPrazo(data_reporte: string | null, sla_dias: number | null, estado: string | null) {
  if (!data_reporte || sla_dias == null) return false
  if (isClosedEstado(estado)) return false

  const inicio = parseDateSafe(data_reporte)
  if (!inicio) return false

  inicio.setHours(0, 0, 0, 0)

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const prazoFinal = new Date(inicio)
  prazoFinal.setDate(prazoFinal.getDate() + Number(sla_dias))

  return hoje > prazoFinal
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const expected = `Bearer ${process.env.CRON_SECRET}`

    if (!process.env.CRON_SECRET || authHeader !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !process.env.RESEND_API_KEY ||
      !process.env.EMAIL_FROM ||
      !process.env.NEXT_PUBLIC_APP_URL
    ) {
      return NextResponse.json(
        { error: 'Variáveis de ambiente em falta.' },
        { status: 500 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
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
      .not('created_by_email', 'is', null)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let sent = 0

    for (const item of data || []) {
      const overdue = isForaPrazo(item.data_reporte, item.sla_dias, item.estado)

      if (!overdue) continue
      if (item.sla_alert_sent_at) continue
      if (!item.created_by_email) continue

      const unitName = Array.isArray(item.units)
        ? item.units[0]?.nome || item.local_ocorrencia || '-'
        : item.units?.nome || item.local_ocorrencia || '-'

      const link = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/ocorrencia/${item.id}`

      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: item.created_by_email,
        subject: `Ocorrência fora do prazo - ${item.ocorrencia || 'Ocorrência'}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height:1.6; color:#0f172a;">
            <h2>Ocorrência fora do prazo</h2>
            <p>A ocorrência abaixo ultrapassou o prazo definido.</p>
            <ul>
              <li><strong>Ocorrência:</strong> ${item.ocorrencia || '-'}</li>
              <li><strong>Unidade:</strong> ${unitName}</li>
              <li><strong>Categoria:</strong> ${item.categoria || '-'}</li>
              <li><strong>Prioridade:</strong> ${item.prioridade || '-'}</li>
              <li><strong>Impacto:</strong> ${item.impacto || '-'}</li>
              <li><strong>Estado:</strong> ${item.estado || '-'}</li>
            </ul>
            <p>
              <a href="${link}" style="display:inline-block;padding:10px 16px;background:#0f172a;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">
                Abrir ocorrência
              </a>
            </p>
          </div>
        `,
        text: `A ocorrência "${item.ocorrencia || '-'}" está fora do prazo. Abrir: ${link}`,
      })

      await supabase
        .from('occurrences')
        .update({ sla_alert_sent_at: new Date().toISOString() })
        .eq('id', item.id)

      sent += 1
    }

    return NextResponse.json({ success: true, sent })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro no cron SLA.' },
      { status: 500 }
    )
  }
}
