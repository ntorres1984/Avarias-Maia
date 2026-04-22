'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

type NotificationItem = {
  id: string
  occurrence_id: string | null
  title: string
  message: string
  read: boolean
  created_at: string
}

const styles = {
  wrapper: {
    position: 'relative' as const,
  },

  button: {
    position: 'relative' as const,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '46px',
    height: '46px',
    borderRadius: '999px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontSize: '20px',
  } as const,

  badge: {
    position: 'absolute' as const,
    top: '-4px',
    right: '-2px',
    minWidth: '20px',
    height: '20px',
    borderRadius: '999px',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 700,
    padding: '0 6px',
  } as const,

  panel: {
    position: 'absolute' as const,
    top: '56px',
    right: 0,
    width: '380px',
    maxHeight: '460px',
    overflowY: 'auto' as const,
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
    zIndex: 1000,
  } as const,

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid #e2e8f0',
  } as const,

  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
    color: '#0f172a',
  } as const,

  markAllBtn: {
    background: 'none',
    border: 'none',
    color: '#1d4ed8',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '13px',
  } as const,

  list: {
    display: 'flex',
    flexDirection: 'column' as const,
  },

  itemBox: {
    display: 'block',
    width: '100%',
    border: 'none',
    background: 'transparent',
    padding: 0,
    margin: 0,
    textAlign: 'left' as const,
    cursor: 'pointer',
  } as const,

  item: {
    padding: '14px 16px',
    borderBottom: '1px solid #f1f5f9',
    textDecoration: 'none',
    color: '#0f172a',
    display: 'block',
  } as const,

  itemUnread: {
    backgroundColor: '#eff6ff',
  } as const,

  itemTitle: {
    fontSize: '14px',
    fontWeight: 700,
    marginBottom: '6px',
  } as const,

  itemMessage: {
    fontSize: '13px',
    color: '#475569',
    marginBottom: '8px',
    lineHeight: 1.4,
  } as const,

  itemDate: {
    fontSize: '12px',
    color: '#64748b',
  } as const,

  empty: {
    padding: '20px',
    textAlign: 'center' as const,
    color: '#64748b',
    fontSize: '14px',
  } as const,
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('pt-PT')
}

export default function NotificationsBell() {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [hasLoadedItems, setHasLoadedItems] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  async function loadUnreadCount(currentUserId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUserId)
      .eq('read', false)

    if (error) {
      console.error('Erro ao carregar contador de notificações:', error)
      return
    }

    setUnreadCount(count || 0)
  }

  async function loadNotifications(currentUserId: string) {
    setLoading(true)

    const { data, error } = await supabase
      .from('notifications')
      .select('id, occurrence_id, title, message, read, created_at')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Erro ao carregar notificações:', error)
      setItems([])
      setLoading(false)
      return
    }

    const nextItems = (data || []) as NotificationItem[]
    setItems(nextItems)
    setUnreadCount(nextItems.filter((item) => !item.read).length)
    setHasLoadedItems(true)
    setLoading(false)
  }

  async function bootstrapUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setUserId(null)
      setItems([])
      setUnreadCount(0)
      return
    }

    setUserId(user.id)
    await loadUnreadCount(user.id)
  }

  async function markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      return
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item
      )
    )

    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  async function markAllAsRead() {
    if (!userId) return

    const unreadIds = items.filter((item) => !item.read).map((item) => item.id)
    if (unreadIds.length === 0) return

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds)

    if (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      return
    }

    setItems((prev) => prev.map((item) => ({ ...item, read: true })))
    setUnreadCount(0)
  }

  useEffect(() => {
    void bootstrapUser()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open || !userId || hasLoadedItems) return
    void loadNotifications(userId)
  }, [open, userId, hasLoadedItems])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void loadUnreadCount(userId)

          if (open) {
            void loadNotifications(userId)
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase, userId, open])

  return (
    <div style={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        style={styles.button}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notificações"
        title="Notificações"
      >
        🔔
        {unreadCount > 0 ? <span style={styles.badge}>{unreadCount}</span> : null}
      </button>

      {open ? (
        <div style={styles.panel}>
          <div style={styles.header}>
            <h3 style={styles.title}>Notificações</h3>
            <button
              type="button"
              style={styles.markAllBtn}
              onClick={() => void markAllAsRead()}
            >
              Marcar todas como lidas
            </button>
          </div>

          {loading ? (
            <div style={styles.empty}>A carregar...</div>
          ) : items.length === 0 ? (
            <div style={styles.empty}>Sem notificações</div>
          ) : (
            <div style={styles.list}>
              {items.map((item) => {
                const content = (
                  <div
                    style={{
                      ...styles.item,
                      ...(item.read ? {} : styles.itemUnread),
                    }}
                  >
                    <div style={styles.itemTitle}>{item.title}</div>
                    <div style={styles.itemMessage}>{item.message}</div>
                    <div style={styles.itemDate}>{formatDateTime(item.created_at)}</div>
                  </div>
                )

                if (item.occurrence_id) {
                  return (
                    <Link
                      key={item.id}
                      href={`/dashboard/ocorrencia/${item.occurrence_id}`}
                      onClick={() => {
                        void markAsRead(item.id)
                        setOpen(false)
                      }}
                    >
                      {content}
                    </Link>
                  )
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void markAsRead(item.id)}
                    style={styles.itemBox}
                  >
                    {content}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
