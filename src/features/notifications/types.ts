// ─── Notification Domain Types ──────────────────────────────────────────────────

export type NotificationType = 'settled' | 'request' | 'confirmation' | 'reminder' | 'dispute' | 'edited'

export type NotificationTheme = 'green' | 'orange'

export type NotificationSection = 'recent' | 'action_needed'

export interface NotificationItem {
  id: string
  type: NotificationType
  tag: string
  title: string
  subtitle: string
  time?: string
  theme: NotificationTheme
  section: NotificationSection
}
