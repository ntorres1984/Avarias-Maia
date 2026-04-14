import type { SupabaseClient } from '@supabase/supabase-js'

type CreateNotificationParams = {
  supabase: SupabaseClient
  userId: string
  occurrenceId?: string | null
  title: string
  message: string
}

export async function createNotification({
  supabase,
  userId,
  occurrenceId = null,
  title,
  message,
}: CreateNotificationParams) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    occurrence_id: occurrenceId,
    title,
    message,
    read: false,
  })

  if (error) {
    console.error('Erro ao criar notificação:', error)
    throw error
  }
}
