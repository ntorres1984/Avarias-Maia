import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const token = String(body?.token || '')
    const score = Number(body?.score)
    const comment =
      typeof body?.comment === 'string' ? body.comment.trim() : null

    if (!token) {
      return NextResponse.json(
        { error: 'Token inválido.' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json(
        { error: 'Pontuação inválida.' },
        { status: 400 }
      )
    }

    const { data: occurrence, error: fetchError } = await supabaseAdmin
      .from('occurrences')
      .select('id, satisfaction_submitted_at')
      .eq('satisfaction_token', token)
      .single()

    if (fetchError || !occurrence) {
      return NextResponse.json(
        { error: 'Ligação de avaliação inválida ou expirada.' },
        { status: 404 }
      )
    }

    if (occurrence.satisfaction_submitted_at) {
      return NextResponse.json(
        { error: 'Esta avaliação já foi submetida.' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabaseAdmin
      .from('occurrences')
      .update({
        satisfaction_score: score,
        satisfaction_comment: comment || null,
        satisfaction_submitted_at: new Date().toISOString(),
      })
      .eq('id', occurrence.id)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
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
