import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { email, nome, ocorrenciaId } = body

    if (!email) {
      return NextResponse.json({ error: 'Email em falta' }, { status: 400 })
    }

    const url = `${process.env.NEXT_PUBLIC_APP_URL}/avaliacao/${ocorrenciaId}`

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: 'Ocorrência concluída',
      html: `
        <p>Olá ${nome || ''},</p>
        <p>A sua ocorrência foi concluída.</p>
        <p>Por favor avalie o serviço:</p>
        <a href="${url}">Avaliar ocorrência</a>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar email' },
      { status: 500 }
    )
  }
}
