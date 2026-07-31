import { formatCurrency } from '@/lib/currency'
import { payloadOf, type Notification } from '../types'

/** "3 days ago" / "2 weeks ago" / "Just now" from an ISO timestamp — this
 * feature is the first real (non-mock) consumer of relative time in the
 * app, so there's no shared formatter yet to reuse. */
export function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

export type NotificationTheme = 'green' | 'orange'

export interface NotificationCardContent {
  tag: string
  title: string
  subtitle: string
  theme: NotificationTheme
}

/** Maps a real Notification (type + payload) to the card's display
 * strings — the mock screen used to bake these in at seed time; here
 * they're derived from the backend payload shapes documented in
 * apps/notifications/services.py. */
export function getNotificationCardContent(notification: Notification): NotificationCardContent {
  switch (notification.type) {
    case 'payment_settled': {
      const p = payloadOf(notification as Notification & { type: 'payment_settled' })
      return {
        tag: 'Payment settled',
        title: `${p.other_user.full_name} settled ${formatCurrency(Number(p.amount), p.currency)}`,
        subtitle: `${p.context_label} · ${formatTimeAgo(notification.created_at)}`,
        theme: 'green',
      }
    }
    case 'payment_confirmation': {
      const p = payloadOf(notification as Notification & { type: 'payment_confirmation' })
      return {
        tag: 'Payment confirmation',
        title: `${p.payer.full_name} says he paid ${formatCurrency(Number(p.amount), p.currency)}`,
        subtitle: notification.read_at ? 'You responded to this request.' : 'Confirm if you received it.',
        theme: 'green',
      }
    }
    case 'settlement_request': {
      const p = payloadOf(notification as Notification & { type: 'settlement_request' })
      return {
        tag: 'Settlement request',
        title: `${p.requested_by.full_name} requested ${formatCurrency(Number(p.amount), p.currency)}`,
        subtitle: `For: ${p.context_label}`,
        theme: 'green',
      }
    }
    case 'late_payment_reminder': {
      const p = payloadOf(notification as Notification & { type: 'late_payment_reminder' })
      return {
        tag: 'Late payment reminder',
        title: `${p.other_user.full_name} hasn't paid you`,
        subtitle: `${formatCurrency(Number(p.amount), p.currency)} pending from ${p.context_label}`,
        theme: 'orange',
      }
    }
    case 'payment_dispute': {
      const p = payloadOf(notification as Notification & { type: 'payment_dispute' })
      return {
        tag: 'Payment dispute',
        title: 'Dispute raised on your payment',
        subtitle: `${p.disputed_by.full_name} disputed ${formatCurrency(Number(p.amount), p.currency)}`,
        theme: 'orange',
      }
    }
    case 'expense_edited': {
      const p = payloadOf(notification as Notification & { type: 'expense_edited' })
      return {
        tag: 'Expense edited',
        title: p.description,
        subtitle: `${p.edited_by.full_name} edited this expense · ${formatCurrency(Number(p.amount), p.currency)}`,
        theme: 'orange',
      }
    }
    case 'budget_alert': {
      const p = payloadOf(notification as Notification & { type: 'budget_alert' })
      return {
        tag: p.category_name ? `${p.category_name} budget alert` : 'Budget alert',
        title: p.category_name ? `You've reached your ${p.category_name} budget` : 'You have reached your budget limit',
        subtitle: `${formatCurrency(Number(p.spent), p.currency)} of ${formatCurrency(Number(p.limit), p.currency)} spent (${p.used_percentage.toFixed(0)}%)`,
        theme: 'orange',
      }
    }
  }
}
