'use client'

import Image from 'next/image'
import Link from 'next/link'

type Action = {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'default' | 'primary' | 'blue' | 'gray' | 'green' | 'red'
  disabled?: boolean
}

type Props = {
  title: string
  subtitle?: string
  actions?: Action[]
  userName?: string
  userEmail?: string
  avatarUrl?: string | null
}

const styles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },

  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },

  logoBox: {
    display: 'flex',
    alignItems: 'center',
  } as const,

  title: {
    margin: 0,
    fontSize: '40px',
    fontWeight: 700,
    color: '#0f172a',
  } as const,

  subtitle: {
    marginTop: '8px',
    color: '#475569',
    fontSize: '14px',
    fontWeight: 600,
  } as const,

  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },

  userBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginRight: '8px',
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
  } as const,

  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '999px',
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0 as const,
    border: '1px solid #cbd5e1',
  } as const,

  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },

  avatarFallback: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#334155',
  } as const,

  userText: {
    display: 'flex',
    flexDirection: 'column' as const,
    lineHeight: 1.2,
  } as const,

  userName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a',
  } as const,

  userEmail: {
    fontSize: '12px',
    color: '#64748b',
  } as const,

  baseButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
    minHeight: '44px',
    border: '1px solid transparent',
  } as const,
}

function getButtonStyle(variant: Action['variant'], disabled?: boolean) {
  const opacity = disabled ? 0.6 : 1
  const cursor = disabled ? 'not-allowed' : 'pointer'

  if (variant === 'primary') {
    return {
      ...styles.baseButton,
      border: '1px solid #0f172a',
      backgroundColor: '#0f172a',
      color: '#ffffff',
      opacity,
      cursor,
    }
  }

  if (variant === 'blue') {
    return {
      ...styles.baseButton,
      border: '1px solid #1d4ed8',
      backgroundColor: '#1d4ed8',
      color: '#ffffff',
      opacity,
      cursor,
    }
  }

  if (variant === 'gray') {
    return {
      ...styles.baseButton,
      border: '1px solid #475569',
      backgroundColor: '#475569',
      color: '#ffffff',
      opacity,
      cursor,
    }
  }

  if (variant === 'green') {
    return {
      ...styles.baseButton,
      border: '1px solid #15803d',
      backgroundColor: '#15803d',
      color: '#ffffff',
      opacity,
      cursor,
    }
  }

  if (variant === 'red') {
    return {
      ...styles.baseButton,
      border: '1px solid #b91c1c',
      backgroundColor: '#b91c1c',
      color: '#ffffff',
      opacity,
      cursor,
    }
  }

  return {
    ...styles.baseButton,
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    opacity,
    cursor,
  }
}

function getInitials(name?: string, email?: string) {
  const source = (name || email || '').trim()

  if (!source) return '?'

  if (name && name.trim()) {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)

    const first = parts[0]?.[0] || ''
    const second = parts[1]?.[0] || ''

    return `${first}${second}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

export default function DashboardTopbar({
  title,
  subtitle,
  actions = [],
  userName,
  userEmail,
  avatarUrl,
}: Props) {
  const initials = getInitials(userName, userEmail)
  const shouldShowUserBox = Boolean(
    (userName && userName.trim()) ||
      (userEmail && userEmail.trim()) ||
      (avatarUrl && avatarUrl.trim())
  )

  return (
    <div style={styles.wrapper}>
      <div style={styles.left}>
        <div style={styles.logoBox}>
          <Image
            src="/logo-maia-saude.png"
            alt="Maia Saúde"
            width={150}
            height={60}
            style={{ objectFit: 'contain', height: 'auto' }}
            priority
          />
        </div>

        <div>
          <h1 style={styles.title}>{title}</h1>
          {subtitle ? <div style={styles.subtitle}>{subtitle}</div> : null}
        </div>
      </div>

      <div style={styles.actions}>
        {shouldShowUserBox ? (
          <div style={styles.userBox}>
            <div style={styles.avatar}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName || userEmail || 'Utilizador'}
                  style={styles.avatarImage}
                />
              ) : (
                <span style={styles.avatarFallback}>{initials}</span>
              )}
            </div>

            <div style={styles.userText}>
              <span style={styles.userName}>{userName || 'Utilizador'}</span>
              <span style={styles.userEmail}>{userEmail || ''}</span>
            </div>
          </div>
        ) : null}

        {actions.map((action, index) => {
          const buttonStyle = getButtonStyle(action.variant, action.disabled)

          if (action.href && !action.disabled) {
            return (
              <Link
                key={`${action.label}-${index}`}
                href={action.href}
                style={buttonStyle}
              >
                {action.label}
              </Link>
            )
          }

          return (
            <button
              key={`${action.label}-${index}`}
              type="button"
              style={buttonStyle}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
