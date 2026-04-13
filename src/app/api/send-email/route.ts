import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      to,
      subject,
      message,
    }: {
      to: string
      subject: string
      message: string
    } = body

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Dados incompletos.' },
        { status: 400 }
      )
    }

    // Configuração SMTP (vem das variáveis do Vercel)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true se porta 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Enviar email
    await transporter.sendMail({
      from: `"Maia Saúde" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>${subject}</h2>
          <p>${message}</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao enviar email:', error)

    return NextResponse.json(
      { error: 'Erro ao enviar email.' },
      { status: 500 }
    )
  }
}
