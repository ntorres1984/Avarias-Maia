
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '24px',
    fontFamily: 'Arial, sans-serif',
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as const,

  card: {
    width: '100%',
    maxWidth: '720px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  } as const,

  title: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: 700,
  } as const,

  subtitle: {
    margin: '0 0 20px 0',
    fontSize: '14px',
    color: '#64748b',
  } as const,

  scoreRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
    marginBottom: '20px',
  } as const,

  scoreButton: {
    minWidth: '52px',
    minHeight: '52px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 700,
  } as const,

  scoreButtonActive: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: '1px solid #0f172a',
  } as const,

  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
  } as const,

  textarea: {
    width: '100%',
    minHeight: '140px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    padding: '12px',
    fontSize: '14px',
    resize: 'vertical' as const,
    outline: 'none',
  } as const,

  actions: {
    marginTop: '20px',
  } as const,

  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 18px',
    borderRadius: '10px',
    border: '1px solid #0f172a',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
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

  messageError: {
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '16px',
    fontSize: '14px',
  } as const,
}

export default function AvaliacaoPage() {
  const params = useParams()
  const token = String(params.token)

  const [score, setScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

    if (!score) {
      setErrorMessage('Seleciona uma pontuação de 1 a 5.')
      return
    }

    setLoading(true)

    const response = await fetch('/api/avaliacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        score,
        comment,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      setErrorMessage(result?.error || 'Não foi possível registar a avaliação.')
      setLoading(false)
      return
    }

    setSuccessMessage('Obrigado. A sua avaliação foi registada com sucesso.')
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Avaliação de satisfação</h1>
        <p style={styles.subtitle}>
          Avalie a resolução da ocorrência numa escala de 1 a 5.
        </p>

        {errorMessage && <div style={styles.messageError}>{errorMessage}</div>}
        {successMessage && <div style={styles.messageSuccess}>{successMessage}</div>}

        {!successMessage && (
          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Pontuação</label>

            <div style={styles.scoreRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScore(value)}
                  style={{
                    ...styles.scoreButton,
                    ...(score === value ? styles.scoreButtonActive : {}),
                  }}
                >
                  {value}
                </button>
              ))}
            </div>

            <label style={styles.label}>Comentário</label>
            <textarea
              style={styles.textarea}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Opcional. Pode indicar se ficou satisfeito com a resolução, tempo de resposta, qualidade da intervenção, etc."
            />

            <div style={styles.actions}>
              <button type="submit" style={styles.btn} disabled={loading}>
                {loading ? 'A enviar...' : 'Submeter avaliação'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
