'use client'

import Image from 'next/image'
import Link from 'next/link'
import NotificationsBell from './NotificationsBell'

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

  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },

  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },

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

export default function DashboardTopbar({
  title,
  subtitle,
  actions = [],
}: Props) {
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

      <div style={styles.right}>
        <NotificationsBell />

        <div style={styles.actions}>
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
    </div>
  )
}
