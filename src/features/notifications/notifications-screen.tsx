import { memo, useCallback, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Check, Wallet, CheckCircle2, Clock, AlertTriangle, MoreVertical, Users, RefreshCw } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from '@/components/shared/empty-state'
import InfiniteScrollSentinel from '@/components/shared/infinite-scroll-sentinel'
import ConfirmActionDrawer from '@/components/shared/confirm-action-drawer'
import { haptic } from '@/lib/haptics'
import { useNotificationsQuery } from './api/use-notifications-query'
import {
  useClearAllNotificationsMutation,
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useRequestSettlementMutation,
} from './api/use-notification-mutations'
import { getNotificationCardContent, formatTimeAgo } from './lib/format'
import NotificationCard, { type NotificationAction } from './components/notification-card'
import SwipeableNotificationRow from './components/swipeable-notification-row'
import NotificationOptionsDrawer from './components/notification-options-drawer'
import { payloadOf, type Notification } from './types'

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'payment_settled':
    case 'expense_added':
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
    case 'added_to_group':
      return (
        <div className="w-10 h-10 rounded-[14px] bg-[#E4F2EB] flex items-center justify-center text-positive border border-positive/10">
          <Users size={20} strokeWidth={2.2} />
        </div>
      )
    case 'balance_adjusted':
      return (
        <div className="w-10 h-10 rounded-[14px] bg-[#EDE7F6] flex items-center justify-center text-[#6C4FCE] border border-[#6C4FCE]/10">
          <RefreshCw size={20} strokeWidth={2.2} />
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

type NavigateFn = ReturnType<typeof useNavigate>

/** Rendering + action logic for one card, split out so it can be
 * React.memo'd — markRead.mutate/requestSettlement.mutate/navigate are all
 * stable references (TanStack Query/Router memoize them internally), so
 * this only re-renders when its own `notification` object actually
 * changes, not on every list re-render or unrelated item's mutation. */
const NotificationListItem = memo(function NotificationListItem({
  notification,
  navigate,
  markRead,
  requestSettlement,
  onDelete,
}: {
  notification: Notification
  navigate: NavigateFn
  markRead: ReturnType<typeof useMarkNotificationReadMutation>['mutate']
  requestSettlement: ReturnType<typeof useRequestSettlementMutation>['mutate']
  onDelete: (id: string, message?: string) => void
}) {
  const handleIgnore = useCallback((id: string) => {
    haptic.heavy()
    onDelete(id, 'Notification ignored')
  }, [onDelete])

  const handleRemind = useCallback((n: Notification & { type: 'late_payment_reminder' }) => {
    haptic.light()
    const p = payloadOf(n)
    requestSettlement(
      {
        other_user_id: p.other_user.id,
        friendship_id: p.target_type === 'friendship' ? p.target_id : undefined,
        group_id: p.target_type === 'group' ? p.target_id : undefined,
      },
      {
        onSuccess: () => {
          markRead(n.id)
        },
      },
    )
  }, [markRead, requestSettlement])

  const goToSettlement = useCallback((id: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    markRead(id)
  }, [markRead])

  const actions = useMemo((): NotificationAction[] | undefined => {
    if (notification.action_status !== 'pending' && notification.read_at) {
      return undefined
    }

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
              markRead(notification.id)
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
              markRead(notification.id)
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
              markRead(notification.id)
              navigate({ to: ROUTES.TRANSACTION_DETAILS, params: { id: p.expense_id } })
            },
          },
          { label: 'Ignore', variant: 'amber', onClick: () => handleIgnore(notification.id) },
        ]
      }
      case 'expense_added': {
        const p = payloadOf(notification as Notification & { type: 'expense_added' })
        return [
          {
            label: 'View Expense',
            variant: 'green',
            onClick: (e) => {
              e.stopPropagation()
              markRead(notification.id)
              navigate({ to: ROUTES.TRANSACTION_DETAILS, params: { id: p.expense_id } })
            },
          },
          { label: 'Ignore', variant: 'amber', onClick: () => handleIgnore(notification.id) },
        ]
      }
      case 'added_to_group':
      case 'balance_adjusted':
        return undefined
    }
  }, [notification, navigate, markRead, handleIgnore, handleRemind, goToSettlement])

  const handleCardClick = useCallback(() => {
    if (notification.type === 'expense_added') {
      const p = payloadOf(notification as Notification & { type: 'expense_added' })
      markRead(notification.id)
      navigate({ to: ROUTES.TRANSACTION_DETAILS, params: { id: p.expense_id } })
    } else if (notification.type === 'payment_settled') {
      const p = payloadOf(notification as Notification & { type: 'payment_settled' })
      markRead(notification.id)
      navigate({ to: ROUTES.SETTLEMENT_DETAILS, params: { id: p.settlement_id } })
    } else if (notification.type === 'payment_confirmation' && notification.action_status === 'resolved') {
      const p = payloadOf(notification as Notification & { type: 'payment_confirmation' })
      navigate({ to: ROUTES.SETTLEMENT_DETAILS, params: { id: p.settlement_id } })
    } else if (notification.type === 'added_to_group') {
      const p = payloadOf(notification as Notification & { type: 'added_to_group' })
      markRead(notification.id)
      navigate({ to: ROUTES.GROUP_DETAILS, params: { id: p.group_id } })
    } else if (notification.type === 'balance_adjusted') {
      const p = payloadOf(notification as Notification & { type: 'balance_adjusted' })
      markRead(notification.id)
      navigate({ to: ROUTES.CONTACT_DETAILS, params: { id: p.adjusted_by.id } })
    }
  }, [notification, navigate, markRead])

  const content = getNotificationCardContent(notification)

  return (
    <SwipeableNotificationRow notificationId={notification.id} theme={content.theme} onDelete={onDelete}>
      <NotificationCard
        id={notification.id}
        tag={content.tag}
        title={content.title}
        subtitle={content.subtitle}
        time={formatTimeAgo(notification.created_at)}
        theme={content.theme}
        icon={getNotificationIcon(notification.type)}
        actions={actions}
        onCardClick={handleCardClick}
      />
    </SwipeableNotificationRow>
  )
})

export default function NotificationsScreen() {
  const navigate = useNavigate({ from: '/notifications/' })

  const { data: notifications, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useNotificationsQuery()
  const markRead = useMarkNotificationReadMutation()
  const markAllRead = useMarkAllNotificationsReadMutation()
  const requestSettlement = useRequestSettlementMutation()
  const deleteNotification = useDeleteNotificationMutation()
  const clearAllNotifications = useClearAllNotificationsMutation()

  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set())
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [clearAllOpen, setClearAllOpen] = useState(false)

  const removePendingDelete = useCallback((id: string) => {
    setPendingDeleteIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  // Swipe/ignore removes the row optimistically and commits immediately;
  // the app intentionally has no transient toast/undo overlay.
  const handleDelete = useCallback((id: string) => {
    setPendingDeleteIds((prev) => new Set(prev).add(id))
    deleteNotification.mutate(id, {
      onError: () => removePendingDelete(id),
    })
  }, [deleteNotification, removePendingDelete])

  const needsAction = useCallback((notification: Notification) => (
    notification.action_status === 'pending'
    || (notification.type !== 'payment_settled' && !notification.read_at)
  ), [])

  // Business action state takes precedence over read state. A pending
  // payment confirmation stays actionable even if the card was opened;
  // confirming/disputing/cancelling it resolves the row server-side.
  const recentList = useMemo(
    () => (notifications ?? []).filter((n) => !pendingDeleteIds.has(n.id) && !needsAction(n)),
    [notifications, pendingDeleteIds, needsAction],
  )
  const actionList = useMemo(
    () => (notifications ?? []).filter((n) => !pendingDeleteIds.has(n.id) && needsAction(n)),
    [notifications, pendingDeleteIds, needsAction],
  )

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] overflow-hidden relative select-none">
      {/* Screen Title Header */}
      <div className="px-6 pt-7 pb-4 flex items-center justify-between">
        <h1 className="text-[26px] font-extrabold text-[#1A1A1A] leading-tight tracking-tight text-left">
          Notifications
        </h1>
        {(recentList.length > 0 || actionList.length > 0) && (
          <button
            type="button"
            onClick={() => {
              haptic.light()
              setOptionsOpen(true)
            }}
            className="text-[#C8C4BD] p-1.5 cursor-pointer bg-transparent border-0 hover:text-[#1A1A1A] transition-colors shrink-0 flex items-center justify-center"
            aria-label="Notification options"
          >
            <MoreVertical size={20} />
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
              {actionList.map((item) => (
                <NotificationListItem
                  key={item.id}
                  notification={item}
                  navigate={navigate}
                  markRead={markRead.mutate}
                  requestSettlement={requestSettlement.mutate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {!isLoading && recentList.length > 0 && (
          <div className="flex flex-col gap-3.5">
            <h3 className="px-6 text-[12px] font-extrabold text-[#9A9590] tracking-wider uppercase text-left">
              Recent
            </h3>
            <div className="px-6 flex flex-col gap-3.5">
              {recentList.map((item) => (
                <NotificationListItem
                  key={item.id}
                  notification={item}
                  navigate={navigate}
                  markRead={markRead.mutate}
                  requestSettlement={requestSettlement.mutate}
                  onDelete={handleDelete}
                />
              ))}
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

      <NotificationOptionsDrawer
        isOpen={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        hasUnread={notifications?.some((n) => !n.read_at) ?? false}
        onMarkAllReadClick={() => {
          haptic.light()
          markAllRead.mutate()
        }}
        onClearAllClick={() => setClearAllOpen(true)}
      />

      <ConfirmActionDrawer
        isOpen={clearAllOpen}
        onClose={() => setClearAllOpen(false)}
        title="Clear all notifications?"
        confirmTitle="This can't be undone"
        confirmDescription="All notifications, read and unread, will be permanently removed from your inbox. Your balances and expense history are not affected."
        buttonText="Clear all"
        variant="danger"
        onConfirm={() => {
          haptic.heavy()
          clearAllNotifications.mutate(undefined, {
            onError: () => {},
          })
        }}
      />
    </div>
  )
}
