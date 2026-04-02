'use client'

import Link from 'next/link'

type ActionItem = {
  label: string
  href: string
  variant?: 'default' | 'primary'
}

type DashboardTopbarProps = {
  title: string
  subtitle?: string
  actions?: ActionItem[]
}

const styles = {
  wrap: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap' as const,
    marginBottom: '24px',
  },

  left: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },

  title: {
    margin: 0,
    fontSize: '30px',
    fontWeight: 700,
    color: '#0f172a',
  } as const,

  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#64748b',
  } as const,

  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },

  btnDefault: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '14px',
  } as const,

  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #0f172a',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '14px',
  } as const,
}

export default function DashboardTopbar({
  title,
  subtitle,
  actions = [],
}: DashboardTopbarProps) {
  return (
    <div style={styles.wrap}>
      <div style={styles.left}>
        <h1 style={styles.title}>{title}</h1>
        {subtitle ? <p style={styles.subtitle}>{subtitle}</p> : null}
      </div>

      {actions.length > 0 && (
        <div style={styles.actions}>
          {actions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              style={action.variant === 'primary' ? styles.btnPrimary : styles.btnDefault}
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
