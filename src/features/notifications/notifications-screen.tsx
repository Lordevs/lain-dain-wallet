import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Check, Wallet, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from '@/components/shared/empty-state'
import InfiniteScrollSentinel from '@/components/shared/infinite-scroll-sentinel'
import { haptic } from '@/lib/haptics'
import { useNotificationsQuery } from './api/use-notifications-query'
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useRequestSettlementMutation,
} from './api/use-notification-mutations'
import { getNotificationCardContent, formatTimeAgo } from './lib/format'
import NotificationCard, { type NotificationAction } from './components/notification-card'
import { payloadOf, type Notification } from './types'

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'payment_settled':
      return (
        <div className="w-10 h-10 rounded-[14px] bg-[#E4F2EB] flex items-center justify-center text-positive border border-positive/10">
          <Check size={20} strokeWidth={3} />
        </div>
      )
    case 'settlement_request':
      return (
        <div className="w-10 h-10 rounded-[14px] bg-[#E4F2EB] flex items-center justify-center text-positive border border-positive/10">
          <Wallet size={20} strokeWidth={2} />
        </div>
      )
    case 'payment_confirmation':
      return (
        <div className="w-10 h-10 rounded-[14px] bg-[#E4F2EB] flex items-center justify-center text-positive border border-positive/10">
          <CheckCircle2 size={20} strokeWidth={2.2} className="fill-positive/10" />
        </div>
      )
    case 'late_payment_reminder':
      return (
        <div className="w-10 h-10 rounded-[14px] bg-[#FDF3E7] flex items-center justify-center text-[#C96A1B] border border-[#C96A1B]/10">
          <Clock size={20} strokeWidth={2.2} />
        </div>
      )
    case 'payment_dispute':
    case 'expense_edited':
    case 'budget_alert':
      return (
        <div className="w-10 h-10 rounded-[14px] bg-[#FDF3E7] flex items-center justify-center text-[#C96A1B] border border-[#C96A1B]/10">
          <AlertTriangle size={20} strokeWidth={2.2} className="fill-[#C96A1B]/10" />
        </div>
      )
  }
}

function NotificationListSkeleton() {
  return (
    <div className="px-6 flex flex-col gap-3.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-[18px] border-[0.8px] border-[#EFE7DD] p-5 flex gap-4">
          <Skeleton className="size-10 rounded-[14px] shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function NotificationsScreen() {
  const navigate = useNavigate({ from: '/notifications/' })

  const { data: notifications, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useNotificationsQuery()
  const markRead = useMarkNotificationReadMutation()
  const markAllRead = useMarkAllNotificationsReadMutation()
  const requestSettlement = useRequestSettlementMutation()

  const handleIgnore = (id: string) => {
    haptic.light()
    markRead.mutate(id)
  }

  const handleRemind = (notification: Notification & { type: 'late_payment_reminder' }) => {
    haptic.light()
    const p = payloadOf(notification)
    requestSettlement.mutate(
      {
        other_user_id: p.other_user.id,
        friendship_id: p.target_type === 'friendship' ? p.target_id : undefined,
        group_id: p.target_type === 'group' ? p.target_id : undefined,
      },
      {
        onSuccess: () => {
          markRead.mutate(notification.id)
          toast.success('Reminder sent successfully!')
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  const goToSettlement = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    markRead.mutate(id)
  }

  const getCardActions = (notification: Notification): NotificationAction[] | undefined => {
    switch (notification.type) {
      case 'payment_settled':
        return undefined
      case 'budget_alert':
        return [
          {
            label: 'View',
            variant: 'green',
            onClick: (e) => {
              e.stopPropagation()
              markRead.mutate(notification.id)
              navigate({ to: ROUTES.PERSONAL })
            },
          },
          { label: 'Ignore', variant: 'amber', onClick: () => handleIgnore(notification.id) },
        ]
      case 'settlement_request': {
        const p = payloadOf(notification as Notification & { type: 'settlement_request' })
        return [
          {
            label: 'Settle',
            variant: 'green',
            onClick: (e) => {
              e.stopPropagation()
              markRead.mutate(notification.id)
              if (p.target_type === 'friendship') {
                navigate({ to: ROUTES.SETTLE_UP, search: { contactId: p.requested_by.id } })
              } else {
                navigate({ to: ROUTES.SETTLE_UP, search: { groupId: p.target_id } })
              }
            },
          },
          { label: 'Ignore', variant: 'amber', onClick: () => handleIgnore(notification.id) },
        ]
      }
      case 'payment_confirmation': {
        const p = payloadOf(notification as Notification & { type: 'payment_confirmation' })
        return [
          {
            label: 'Confirm Received',
            variant: 'green',
            onClick: (e) => {
              goToSettlement(notification.id)(e)
              navigate({ to: ROUTES.SETTLEMENT_DETAILS, params: { id: p.settlement_id } })
            },
          },
          {
            label: 'Dispute',
            variant: 'orange',
            onClick: (e) => {
              goToSettlement(notification.id)(e)
              navigate({ to: ROUTES.SETTLEMENT_DETAILS, params: { id: p.settlement_id } })
            },
          },
        ]
      }
      case 'late_payment_reminder':
        return [
          {
            label: 'Remind',
            variant: 'green',
            onClick: (e) => {
              e.stopPropagation()
              handleRemind(notification as Notification & { type: 'late_payment_reminder' })
            },
          },
          { label: 'Ignore', variant: 'amber', onClick: () => handleIgnore(notification.id) },
        ]
      case 'payment_dispute': {
        const p = payloadOf(notification as Notification & { type: 'payment_dispute' })
        return [
          {
            label: 'Pay Again',
            variant: 'orange',
            onClick: (e) => {
              goToSettlement(notification.id)(e)
              navigate({ to: ROUTES.SETTLEMENT_DETAILS, params: { id: p.settlement_id } })
            },
          },
          { label: 'Ignore', variant: 'amber', onClick: () => handleIgnore(notification.id) },
        ]
      }
      case 'expense_edited': {
        const p = payloadOf(notification as Notification & { type: 'expense_edited' })
        return [
          {
            label: 'View Expense',
            variant: 'green',
            onClick: (e) => {
              e.stopPropagation()
              markRead.mutate(notification.id)
              navigate({ to: ROUTES.TRANSACTION_DETAILS, params: { id: p.expense_id } })
            },
          },
          { label: 'Ignore', variant: 'amber', onClick: () => handleIgnore(notification.id) },
        ]
      }
    }
  }

  const handleCardClick = (notification: Notification) => {
    if (notification.type === 'payment_settled') {
      const p = payloadOf(notification as Notification & { type: 'payment_settled' })
      navigate({ to: ROUTES.SETTLEMENT_DETAILS, params: { id: p.settlement_id } })
    }
  }

  // Action Needed only ever holds *unread* actionable notifications —
  // once read (via its own action, Ignore, or mark-all-read), it drops
  // down to Recent with no action buttons, instead of sitting in Action
  // Needed forever regardless of read_at.
  const recentList = (notifications ?? []).filter((n) => n.type === 'payment_settled' || n.read_at)
  const actionList = (notifications ?? []).filter((n) => n.type !== 'payment_settled' && !n.read_at)

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-24 relative select-none">
      {/* Screen Title Header */}
      <div className="px-6 pt-7 pb-4 flex items-center justify-between">
        <h1 className="text-[26px] font-extrabold text-[#1A1A1A] leading-tight tracking-tight text-left">
          Notifications
        </h1>
        {(notifications?.some((n) => !n.read_at) ?? false) && (
          <button
            type="button"
            onClick={() => {
              haptic.light()
              markAllRead.mutate()
            }}
            className="text-xs font-bold text-positive bg-transparent border-0 cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-6">
        {isLoading && <NotificationListSkeleton />}

        {!isLoading && actionList.length > 0 && (
          <div className="flex flex-col gap-3.5">
            <h3 className="px-6 text-[12px] font-extrabold text-[#9A9590] tracking-wider uppercase text-left">
              Action Needed
            </h3>
            <div className="px-6 flex flex-col gap-3.5">
              {actionList.map((item) => {
                const content = getNotificationCardContent(item)
                return (
                  <NotificationCard
                    key={item.id}
                    id={item.id}
                    tag={content.tag}
                    title={content.title}
                    subtitle={content.subtitle}
                    time={formatTimeAgo(item.created_at)}
                    theme={content.theme}
                    icon={getNotificationIcon(item.type)}
                    actions={getCardActions(item)}
                    onCardClick={() => handleCardClick(item)}
                  />
                )
              })}
            </div>
          </div>
        )}

        {!isLoading && recentList.length > 0 && (
          <div className="flex flex-col gap-3.5">
            <h3 className="px-6 text-[12px] font-extrabold text-[#9A9590] tracking-wider uppercase text-left">
              Recent
            </h3>
            <div className="px-6 flex flex-col gap-3.5">
              {recentList.map((item) => {
                const content = getNotificationCardContent(item)
                return (
                  <NotificationCard
                    key={item.id}
                    id={item.id}
                    tag={content.tag}
                    title={content.title}
                    subtitle={content.subtitle}
                    time={formatTimeAgo(item.created_at)}
                    theme={content.theme}
                    icon={getNotificationIcon(item.type)}
                    onCardClick={() => handleCardClick(item)}
                  />
                )
              })}
            </div>
          </div>
        )}

        {!isLoading && recentList.length === 0 && actionList.length === 0 && (
          <EmptyState
            icon={Check}
            iconBgClass="bg-[#E4F2EB] border-positive/10"
            iconColorClass="text-positive"
            title="All caught up!"
            description="No notifications or action items remaining."
          />
        )}

        {!isLoading && (
          <div className="px-6">
            <InfiniteScrollSentinel onLoadMore={fetchNextPage} hasMore={hasNextPage} isLoading={isFetchingNextPage} />
          </div>
        )}
      </div>
    </div>
  )
}
