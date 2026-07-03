import { useRef } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Check, Wallet, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import SuccessCheck from '@/components/shared/success-check'
import NotificationCard, { type NotificationAction } from './components/notification-card'
import { useNotifications } from './hooks/use-notifications'
import { type NotificationItem } from './types'
import SettleUpPanel from './components/settle-up-panel'
import PaymentConfirmationPanel from './components/payment-confirmation-panel'
import PaymentDisputePanel from './components/payment-dispute-panel'
import SendReminderScreen from '@/features/contacts/send-reminder-screen'
import LedgerBreakdownScreen from '@/features/contacts/ledger-breakdown-screen'

export default function NotificationsScreen() {
  const navigate = useNavigate({ from: '/notifications/' })
  const { drawer, contactId, txId } = useSearch({ from: '/notifications/' })
  const openedInSessionRef = useRef(false)

  const closeDrawer = () => {
    if (!drawer) return

    if (openedInSessionRef.current) {
      openedInSessionRef.current = false
      window.history.back()
    } else {
      navigate({
        search: (prev: any) => {
          const next = { ...prev }
          delete next.drawer
          delete next.contactId
          delete next.txId
          return next
        },
        replace: true,
      })
    }
  }

  const openDrawer = (
    dName: 'reminder' | 'breakdown' | 'settle-up' | 'confirm' | 'dispute',
    cid: string
  ) => {
    openedInSessionRef.current = true
    navigate({
      search: (prev: any) => ({
        ...prev,
        drawer: dName,
        // If it's reminder or breakdown, store as contactId. Otherwise store as txId.
        contactId: (dName === 'reminder' || dName === 'breakdown') ? cid : prev.contactId,
        txId: (dName !== 'reminder' && dName !== 'breakdown') ? cid : prev.txId,
      }),
      replace: !!drawer,
    })
  }

  // Decoupled Business Logic & State Layer
  const {
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
  } = useNotifications()

  // Panel visibility states resolved from search query params
  const activeSettleUpNotification = drawer === 'settle-up' ? notifications.find((n) => n.id === txId) || null : null
  const activeConfirmNotification = drawer === 'confirm' ? notifications.find((n) => n.id === txId) || null : null
  const activeDisputeNotification = drawer === 'dispute' ? notifications.find((n) => n.id === txId) || null : null

  // Render Category Icon Badges based on type
  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'settled':
        return (
          <div className="w-10 h-10 rounded-[14px] bg-[#E4F2EB] flex items-center justify-center text-[#0B683A] border border-[#0B683A]/10">
            <Check size={20} strokeWidth={3} />
          </div>
        )
      case 'request':
        return (
          <div className="w-10 h-10 rounded-[14px] bg-[#E4F2EB] flex items-center justify-center text-[#0B683A] border border-[#0B683A]/10">
            <Wallet size={20} strokeWidth={2} />
          </div>
        )
      case 'confirmation':
        return (
          <div className="w-10 h-10 rounded-[14px] bg-[#E4F2EB] flex items-center justify-center text-[#0B683A] border border-[#0B683A]/10">
            <CheckCircle2 size={20} strokeWidth={2.2} className="fill-[#0B683A]/10" />
          </div>
        )
      case 'reminder':
        return (
          <div className="w-10 h-10 rounded-[14px] bg-[#FDF3E7] flex items-center justify-center text-[#C96A1B] border border-[#C96A1B]/10">
            <Clock size={20} strokeWidth={2.2} />
          </div>
        )
      case 'dispute':
      case 'edited':
        return (
          <div className="w-10 h-10 rounded-[14px] bg-[#FDF3E7] flex items-center justify-center text-[#C96A1B] border border-[#C96A1B]/10">
            <AlertTriangle size={20} strokeWidth={2.2} className="fill-[#C96A1B]/10" />
          </div>
        )
    }
  }

  // Map Card Actions based on Item State and Type
  const getCardActions = (item: NotificationItem): NotificationAction[] | undefined => {
    if (item.section === 'recent') return undefined

    switch (item.type) {
      case 'request':
        return [
          {
            label: 'Settle',
            variant: 'green',
            onClick: (e) => {
              e.stopPropagation()
              openDrawer('settle-up', item.id)
            },
          },
          {
            label: 'Ignore',
            variant: 'amber',
            onClick: (e) => {
              e.stopPropagation()
              handleIgnore(item.id)
            },
          },
        ]
      case 'confirmation':
        return [
          {
            label: 'Confirm Received',
            variant: 'green',
            onClick: (e) => {
              e.stopPropagation()
              openDrawer('confirm', item.id)
            },
          },
          {
            label: 'Dispute',
            variant: 'orange',
            onClick: (e) => {
              e.stopPropagation()
              openDrawer('confirm', item.id)
            },
          },
        ]
      case 'reminder':
        return [
          {
            label: 'Remind',
            variant: 'green',
            onClick: (e) => {
              e.stopPropagation()
              handleRemind(item.id)
            },
          },
          {
            label: 'Ignore',
            variant: 'amber',
            onClick: (e) => {
              e.stopPropagation()
              handleIgnore(item.id)
            },
          },
        ]
      case 'dispute':
        return [
          {
            label: 'Pay Again',
            variant: 'orange',
            onClick: (e) => {
              e.stopPropagation()
              openDrawer('dispute', item.id)
            },
          },
          {
            label: 'Ignore',
            variant: 'amber',
            onClick: (e) => {
              e.stopPropagation()
              handleIgnore(item.id)
            },
          },
        ]
      case 'edited':
        return [
          {
            label: 'View Expense',
            variant: 'green',
            onClick: (e) => {
              e.stopPropagation()
              navigate({ to: ROUTES.TRANSACTION_DETAILS, params: { id: item.txId || item.id } })
            },
          },
          {
            label: 'Ignore',
            variant: 'amber',
            onClick: (e) => {
              e.stopPropagation()
              handleIgnore(item.id)
            },
          },
        ]
      default:
        return undefined
    }
  }

  // Handle generic card body clicks
  const handleCardClick = (item: NotificationItem) => {
    if (item.type === 'edited') {
      navigate({ to: ROUTES.TRANSACTION_DETAILS, params: { id: item.txId || item.id } })
    } else if (item.type === 'request') {
      openDrawer('settle-up', item.id)
    } else if (item.type === 'confirmation') {
      openDrawer('confirm', item.id)
    } else if (item.type === 'dispute') {
      openDrawer('dispute', item.id)
    } else if (item.type === 'reminder') {
      openDrawer('reminder', '1')
    } else {
      openDrawer('breakdown', '1')
    }
  }

  // Filter lists by sections
  const recentList = notifications.filter((n) => n.section === 'recent')
  const actionList = notifications.filter((n) => n.section === 'action_needed')

  // Handle animation completion checks
  if (activeAnimation) {
    const [action, targetId] = activeAnimation.split('-')
    return (
      <div className="fixed inset-0 z-60 bg-[#FEFAF1] flex flex-col justify-center select-none">
        <SuccessCheck
          onComplete={() => {
            if (action === 'settle') {
              handleSettleComplete(targetId)
            } else if (action === 'confirm') {
              handleConfirmComplete(targetId)
            } else if (action === 'remind') {
              handleRemindComplete(targetId)
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-24 relative select-none">
      {/* Toast Alert Indicator */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0B683A] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-[0px_4px_16px_rgba(11,104,58,0.2)] animate-in fade-in slide-in-from-top duration-300">
          {toastMessage}
        </div>
      )}

      {/* Screen Title Header */}
      <div className="px-6 pt-7 pb-4">
        <h1 className="text-[26px] font-extrabold text-[#1A1A1A] leading-tight tracking-tight text-left">
          Notifications
        </h1>
      </div>

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-6">
        {/* Recent Section */}
        {recentList.length > 0 && (
          <div className="flex flex-col gap-3.5">
            <h3 className="px-6 text-[12px] font-extrabold text-[#9A9590] tracking-wider uppercase text-left">
              Recent
            </h3>
            <div className="px-6 flex flex-col gap-3.5">
              {recentList.map((item) => (
                <NotificationCard
                  key={item.id}
                  id={item.id}
                  tag={item.tag}
                  title={item.title}
                  subtitle={item.subtitle}
                  time={item.time}
                  theme={item.theme}
                  icon={getNotificationIcon(item.type)}
                  actions={getCardActions(item)}
                  onCardClick={() => handleCardClick(item)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action Needed Section */}
        {actionList.length > 0 && (
          <div className="flex flex-col gap-3.5">
            <h3 className="px-6 text-[12px] font-extrabold text-[#9A9590] tracking-wider uppercase text-left">
              Action Needed
            </h3>
            <div className="px-6 flex flex-col gap-3.5">
              {actionList.map((item) => (
                <NotificationCard
                  key={item.id}
                  id={item.id}
                  tag={item.tag}
                  title={item.title}
                  subtitle={item.subtitle}
                  time={item.time}
                  theme={item.theme}
                  icon={getNotificationIcon(item.type)}
                  actions={getCardActions(item)}
                  onCardClick={() => handleCardClick(item)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {recentList.length === 0 && actionList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <p className="text-[#9A9590] text-sm font-semibold">All caught up!</p>
            <p className="text-[#9A9590] text-xs mt-1">No notifications or action items remaining.</p>
          </div>
        )}
      </div>

      {/* Sliding Settle Up Panel */}
      {activeSettleUpNotification && (
        <SettleUpPanel
          notification={activeSettleUpNotification}
          onClose={closeDrawer}
          onConfirm={() => {
            handleSettle(activeSettleUpNotification.id)
            closeDrawer()
          }}
        />
      )}

      {/* Sliding Payment Confirmation Panel */}
      {activeConfirmNotification && (
        <PaymentConfirmationPanel
          notification={activeConfirmNotification}
          onClose={closeDrawer}
          onConfirmReceived={() => {
            handleConfirmReceived(activeConfirmNotification.id)
            closeDrawer()
          }}
          onDispute={() => {
            triggerToast('Dispute logged')
            closeDrawer()
          }}
        />
      )}

      {/* Sliding Payment Dispute Panel */}
      {activeDisputeNotification && (
        <PaymentDisputePanel
          notification={activeDisputeNotification}
          onClose={closeDrawer}
          onPayAgain={() => {
            triggerToast('Redirecting to Payment screen...')
            closeDrawer()
          }}
          onIgnore={() => {
            handleIgnore(activeDisputeNotification.id)
            closeDrawer()
          }}
        />
      )}

      {drawer === 'reminder' && contactId && (
        <SendReminderScreen contactId={contactId} onClose={closeDrawer} />
      )}

      {drawer === 'breakdown' && contactId && (
        <LedgerBreakdownScreen contactId={contactId} onClose={closeDrawer} />
      )}
    </div>
  )
}
