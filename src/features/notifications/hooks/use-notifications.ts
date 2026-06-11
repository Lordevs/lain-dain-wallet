import { useState } from 'react'
import { type NotificationItem } from '../types'
import { INITIAL_NOTIFICATIONS } from '../data/mock-notifications'

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [activeAnimation, setActiveAnimation] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
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
