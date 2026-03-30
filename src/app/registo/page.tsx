'use client'

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
    backgroundColor: '#f8fafc',
    padding: '24px',
    fontFamily: 'Arial, sans-serif',
  } as const,

  card: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    padding: '28px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  } as const,

  title: {
    margin: '0 0 8px 0',
    fontSize: '34px',
    fontWeight: 700,
    color: '#0f172a',
  } as const,

  subtitle: {
    margin: '0 0 24px 0',
    color: '#475569',
    fontSize: '15px',
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
    minHeight: '44px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '10px 12px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  } as const,

  btnPrimary: {
    width: '100%',
    minHeight: '46px',
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
    marginTop: '18px',
    fontSize: '14px',
    color: '#475569',
    textAlign: 'center' as const,
  } as const,

  link: {
    color: '#1d4ed8',
    textDecoration: 'none',
    fontWeight: 600,
  } as const,
}

export default function RegistoPage() {
  const supabase = createClient()
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('As passwords não coincidem.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
        },
      },
    })

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    const createdUser = data.user

    if (createdUser) {
      await supabase
        .from('profiles')
        .update({
          nome: nome || email,
        })
        .eq('id', createdUser.id)
    }

    setSuccessMessage(
      'Conta criada com sucesso. Se o teu projeto tiver confirmação por email ativa, confirma primeiro o email antes de entrares.'
    )
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Registo</h1>
        <p style={styles.subtitle}>Cria a tua conta de utilizador.</p>

        {errorMessage && <div style={styles.messageError}>{errorMessage}</div>}
        {successMessage && <div style={styles.messageSuccess}>{successMessage}</div>}

        <form onSubmit={handleRegister}>
          <div style={styles.field}>
            <label style={styles.label}>Nome</label>
            <input
              type="text"
              style={styles.input}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirmar password</label>
            <input
              type="password"
              style={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" style={styles.btnPrimary} disabled={loading}>
            {loading ? 'A registar...' : 'Criar conta'}
          </button>
        </form>

        <div style={styles.footer}>
          Já tens conta?{' '}
          <Link href="/login" style={styles.link}>
            Entrar
          </Link>
        </div>
      </div>
    </div>
  )
}
