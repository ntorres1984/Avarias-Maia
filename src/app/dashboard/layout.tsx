'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
  } as const,

  content: {
    width: '100%',
  } as const,

  loadingWrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: '24px',
    fontFamily: 'Arial, sans-serif',
  } as const,

  loadingCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '24px 28px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
    color: '#0f172a',
    fontSize: '15px',
    fontWeight: 600,
  } as const,
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const router = useRouter()

  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    async function validateSession() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        router.replace('/login')
        return
      }

      setCheckingSession(false)
    }

    validateSession()
  }, [router, supabase])

  if (checkingSession) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingCard}>A validar sessão...</div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <main style={styles.content}>{children}</main>
    </div>
  )
}
