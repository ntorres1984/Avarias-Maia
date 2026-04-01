'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active) return

      if (!user) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, ativo')
        .eq('id', user.id)
        .single()

      if (!active) return

      if (!profile?.ativo) {
        await supabase.auth.signOut()
        router.replace('/login?error=conta_inativa')
        return
      }

      const role = profile?.role ?? 'user'

      if (pathname.startsWith('/dashboard/utilizadores') && role !== 'admin') {
        router.replace('/dashboard')
        return
      }

      if (
        (pathname.startsWith('/dashboard/relatorios') ||
          pathname.startsWith('/dashboard/exportar')) &&
        !['admin', 'gestor', 'tecnico'].includes(role)
      ) {
        router.replace('/dashboard')
        return
      }

      setLoading(false)
    }

    checkAuth()

    return () => {
      active = false
    }
  }, [pathname, router, supabase])

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          A carregar...
        </div>
      </div>
    )
  }

  return <>{children}</>
}
