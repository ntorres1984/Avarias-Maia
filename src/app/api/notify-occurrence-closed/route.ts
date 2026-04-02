import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const occurrenceId = String(body?.occurrenceId || '')

    if (!occurrenceId) {
      return NextResponse.json(
        { error: 'ID da ocorrência em falta.' },
        { status: 400 }
      )
    }

    const { data: occurrence, error: occurrenceError } = await supabaseAdmin
      .from('occurrences')
      .select(`
        id,
        ocorrencia,
        local_ocorrencia,
        estado,
        created_by_email,
        satisfaction_token,
        satisfaction_requested_at,
        satisfaction_submitted_at
      `)
      .eq('id', occurrenceId)
      .single()

    if (occurrenceError || !occurrence) {
      return NextResponse.json(
        { error: 'Ocorrência não encontrada.' },
        { status: 404 }
      )
    }

    if (occurrence.estado !== 'Concluída') {
      return NextResponse.json(
        { error: 'A ocorrência ainda não está concluída.' },
        { status: 400 }
      )
    }

    if (!occurrence.created_by_email) {
      return NextResponse.json(
        { error: 'A ocorrência não tem email do utilizador criador.' },
        { status: 400 }
      )
    }

    if (occurrence.satisfaction_submitted_at) {
      return NextResponse.json({
        success: true,
        message: 'Avaliação já submetida.'
      })
    }

    let token = occurrence.satisfaction_token

    if (!token) {
      token = crypto.randomBytes(24).toString('hex')

      const { error: tokenError } = await supabaseAdmin
        .from('occurrences')
        .update({
          satisfaction_token: token,
          satisfaction_requested_at: new Date().toISOString(),
        })
        .eq('id', occurrenceId)

      if (tokenError) {
        return NextResponse.json(
          { error: tokenError.message },
          { status: 500 }
        )
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const feedbackUrl = `${appUrl}/avaliacao/${token}`

    const { error: emailError } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: occurrence.created_by_email,
      subject: 'A sua ocorrência foi concluída',
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2 style="margin-bottom: 16px;">Ocorrência concluída</h2>

          <p>A ocorrência abaixo foi marcada como <strong>Concluída</strong>:</p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Ocorrência:</strong> ${occurrence.ocorrencia || '-'}</p>
            <p style="margin: 0;"><strong>Unidade:</strong> ${occurrence.local_ocorrencia || '-'}</p>
          </div>

          <p>Pedimos, por favor, que avalie a sua satisfação relativamente à resolução da ocorrência.</p>

          <p style="margin: 24px 0;">
            <a
              href="${feedbackUrl}"
              style="display: inline-block; background: #0f172a; color: white; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 700;"
            >
              Avaliar resolução
            </a>
          </p>

          <p style="font-size: 13px; color: #64748b;">
            Este link permite uma única avaliação associada à ocorrência.
          </p>
        </div>
      `,
    })

    if (emailError) {
      return NextResponse.json(
        { error: emailError.message || 'Erro ao enviar email.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro interno.' },
      { status: 500 }
    )
  }
}
