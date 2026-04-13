import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      to,
      subject,
      message,
      occurrenceId,
    }: {
      to: string
      subject: string
      message: string
      occurrenceId?: string
    } = body

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Dados incompletos.' },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY não configurada.' },
        { status: 500 }
      )
    }

    if (!process.env.EMAIL_FROM) {
      return NextResponse.json(
        { error: 'EMAIL_FROM não configurado.' },
        { status: 500 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const occurrenceUrl =
      occurrenceId && baseUrl
        ? `${baseUrl}/dashboard/ocorrencia/${occurrenceId}`
        : ''

    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2 style="margin-bottom: 16px;">${subject}</h2>
          <p>${message}</p>
          ${
            occurrenceUrl
              ? `
                <p style="margin-top: 20px;">
                  <a
                    href="${occurrenceUrl}"
                    style="display:inline-block;padding:10px 16px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;"
                  >
                    Abrir ocorrência
                  </a>
                </p>
              `
              : ''
          }
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao enviar email:', error)

    return NextResponse.json(
      { error: error?.message || 'Erro ao enviar email.' },
      { status: 500 }
    )
  }
}
