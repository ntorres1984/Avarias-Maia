'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const styles = {
  loadingWrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    fontFamily: 'Arial, sans-serif',
    color: '#0f172a',
    fontSize: '18px',
    fontWeight: 600,
  } as const,
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = createClient()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true

    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        router.replace('/login')
        return
      }

      setChecking(false)
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace('/login')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, supabase])

  if (checking) {
    return <div style={styles.loadingWrap}>A validar sessão...</div>
  }

  return <>{children}</>
}
