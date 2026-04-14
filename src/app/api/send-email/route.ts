import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      to,
      subject,
      html,
      text,
    }: {
      to: string
      subject: string
      html?: string
      text?: string
    } = body

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Dados incompletos para envio de email.' },
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

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    })

    if ((result as any)?.error) {
      return NextResponse.json(
        { error: (result as any).error.message || 'Erro devolvido pelo Resend.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    console.error('Erro ao enviar email:', error)

    return NextResponse.json(
      { error: error?.message || 'Erro ao enviar email.' },
      { status: 500 }
    )
  }
}
