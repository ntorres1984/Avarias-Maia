'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
    padding: '24px',
    fontFamily: 'Arial, sans-serif',
  } as const,

  wrapper: {
    width: '100%',
    maxWidth: '460px',
  } as const,

  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
  } as const,

  logoWrap: {
    textAlign: 'center' as const,
    marginBottom: '18px',
  } as const,

  title: {
    margin: '0 0 10px 0',
    fontSize: '34px',
    fontWeight: 700,
    color: '#0f172a',
    textAlign: 'center' as const,
  } as const,

  subtitle: {
    margin: '0 0 26px 0',
    color: '#475569',
    fontSize: '15px',
    lineHeight: 1.5,
    textAlign: 'center' as const,
  } as const,

  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    marginBottom: '16px',
  },

  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#334155',
  } as const,

  input: {
    minHeight: '46px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '10px 12px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  } as const,

  btnPrimary: {
    width: '100%',
    minHeight: '48px',
    borderRadius: '10px',
    border: '1px solid #0f172a',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '8px',
  } as const,

  messageError: {
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
    fontSize: '14px',
  } as const,

  messageSuccess: {
    color: '#166534',
    backgroundColor: '#dcfce7',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
    fontSize: '14px',
  } as const,

  footer: {
    marginTop: '20px',
    fontSize: '14px',
    color: '#475569',
    textAlign: 'center' as const,
  } as const,

  link: {
    color: '#1d4ed8',
    textDecoration: 'none',
    fontWeight: 600,
  } as const,

  helper: {
    marginTop: '18px',
    fontSize: '13px',
    color: '#64748b',
    textAlign: 'center' as const,
    lineHeight: 1.5,
  } as const,
}

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    async function checkSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        router.replace('/dashboard')
      }
    }

    checkSession()
  }, [router, supabase])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    setSuccessMessage('Login efetuado com sucesso.')
    setLoading(false)
    router.replace('/dashboard')
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.logoWrap}>
            <Image
              src="/logo-maia-saude.png"
              alt="Maia Saúde"
              width={230}
              height={90}
              style={{ objectFit: 'contain', height: 'auto' }}
              priority
            />
          </div>

          <h1 style={styles.title}>Login</h1>
          <p style={styles.subtitle}>
            Acede à plataforma de gestão de avarias e acompanha o estado das ocorrências.
          </p>

          {errorMessage && <div style={styles.messageError}>{errorMessage}</div>}
          {successMessage && <div style={styles.messageSuccess}>{successMessage}</div>}

          <form onSubmit={handleLogin}>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" style={styles.btnPrimary} disabled={loading}>
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>

          <div style={styles.footer}>
            Ainda não tens conta?{' '}
            <Link href="/registo" style={styles.link}>
              Registar
            </Link>
          </div>

          <div style={styles.helper}>
            Plataforma interna de registo e acompanhamento de ocorrências técnicas.
          </div>
        </div>
      </div>
    </div>
  )
}
