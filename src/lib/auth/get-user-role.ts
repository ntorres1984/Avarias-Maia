import { createClient } from '@/lib/supabase/client'

export async function getUserRole() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, ativo')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return null
  }

  return profile
}
