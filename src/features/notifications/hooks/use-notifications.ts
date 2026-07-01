import { useState, useEffect, useRef } from 'react'
import { type NotificationItem } from '../types'
import { INITIAL_NOTIFICATIONS } from '../data/mock-notifications'

// Module-level reference so notification state survives tab switches
// (component unmount/remount) without needing a global store.
let _notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS]

export function useNotifications() {
  const [notifications, setNotificationsRaw] = useState<NotificationItem[]>(_notifications)
  const [activeAnimation, setActiveAnimation] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const setNotifications = (updater: (prev: NotificationItem[]) => NotificationItem[]) => {
    setNotificationsRaw((prev) => {
      const next = updater(prev)
      _notifications = next
      return next
    })
  }

  const triggerToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToastMessage(msg)
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null)
    }, 2500)
  }

  const handleIgnore = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    triggerToast('Notification ignored')
  }

  const handleSettle = (id: string) => {
    setActiveAnimation(`settle-${id}`)
  }

  const handleSettleComplete = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            type: 'settled',
            tag: 'Payment settled',
            title: 'Muzaffar settled Rs. 2,000',
            subtitle: 'Murree Trip · Just now',
            time: undefined,
            theme: 'green',
            section: 'recent',
          }
        }
        return n
      })
    )
    setActiveAnimation(null)
    triggerToast('Payment settled successfully!')
  }

  const handleConfirmReceived = (id: string) => {
    setActiveAnimation(`confirm-${id}`)
  }

  const handleConfirmComplete = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            type: 'settled',
            tag: 'Payment settled',
            title: 'Muzaffar settled Rs. 2,000',
            subtitle: 'Personal ledger · Just now',
            time: undefined,
            theme: 'green',
            section: 'recent',
          }
        }
        return n
      })
    )
    setActiveAnimation(null)
    triggerToast('Payment confirmation approved!')
  }

  const handleRemind = (id: string) => {
    setActiveAnimation(`remind-${id}`)
  }

  const handleRemindComplete = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            subtitle: 'Rs. 2,000 pending from Murree Trip. (Reminder sent)',
          }
        }
        return n
      })
    )
    setActiveAnimation(null)
    triggerToast('Reminder sent successfully!')
  }

  const clearActiveAnimation = () => {
    setActiveAnimation(null)
  }

  return {
    notifications,
    activeAnimation,
    toastMessage,
    triggerToast,
    handleIgnore,
    handleSettle,
    handleSettleComplete,
    handleConfirmReceived,
    handleConfirmComplete,
    handleRemind,
    handleRemindComplete,
    clearActiveAnimation,
  }
}
