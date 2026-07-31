import type { components } from '@/lib/api/schema'

export type Notification = components['schemas']['Notification']
export type NotificationApiType = components['schemas']['NotificationTypeEnum']

// ─── Payload shapes ─────────────────────────────────────────────────────────
// `Notification.payload` is typed `unknown` by drf-spectacular (see
// apps/notifications/models.py's docstring: one JSON bag, shape documented
// only in the backend's services.py, not enforced by the DB). These mirror
// each notify_* payload dict verbatim so the frontend can safely narrow on
// `notification.type` and read the fields it built.

interface PersonBrief {
  id: string
  full_name: string
  image: string | null
}

export interface PaymentSettledPayload {
  settlement_id: string
  other_user: PersonBrief
  amount: string
  currency: string
  context_label: string
}

export interface PaymentConfirmationPayload {
  settlement_id: string
  payer: PersonBrief
  amount: string
  currency: string
}

export interface PaymentDisputePayload {
  settlement_id: string
  disputed_by: PersonBrief
  amount: string
  currency: string
}

export interface ExpenseEditedPayload {
  expense_id: string
  edited_by: PersonBrief
  description: string
  amount: string
  currency: string
}

export interface BudgetAlertPayload {
  spent: string
  limit: string
  currency: string
  used_percentage: number
}

export interface SettlementRequestPayload {
  requested_by: PersonBrief
  amount: string
  currency: string
  context_label: string
  target_type: 'friendship' | 'group'
  target_id: string
}

export interface LatePaymentReminderPayload {
  other_user: PersonBrief
  amount: string
  currency: string
  context_label: string
  target_type: 'friendship' | 'group'
  target_id: string
}

export type PayloadFor<T extends NotificationApiType> = T extends 'payment_settled'
  ? PaymentSettledPayload
  : T extends 'payment_confirmation'
    ? PaymentConfirmationPayload
    : T extends 'payment_dispute'
      ? PaymentDisputePayload
      : T extends 'expense_edited'
        ? ExpenseEditedPayload
        : T extends 'budget_alert'
          ? BudgetAlertPayload
          : T extends 'settlement_request'
            ? SettlementRequestPayload
            : T extends 'late_payment_reminder'
              ? LatePaymentReminderPayload
              : never

/** Narrows `notification.payload` (typed `unknown`) to the shape that
 * `notification.type` guarantees it has, per the backend's notify_* builders. */
export function payloadOf<T extends NotificationApiType>(notification: Notification & { type: T }): PayloadFor<T> {
  return notification.payload as PayloadFor<T>
}
