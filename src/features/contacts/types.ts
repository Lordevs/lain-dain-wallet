// ─── Contact Domain Types ─────────────────────────────────────────────────────

/**
 * AppContact — a lightweight contact reference for invites and pre-ledger
 * contacts that don't have balance data yet. Once a contact has a ledger,
 * it's represented by the canonical `Contact` type in `@/types` instead.
 */
export interface AppContact {
  id: string
  name: string
  initials: string
  /** Tailwind classes e.g. "bg-[#E8F5E9] text-[#0B683A]" */
  avatarColor: string
  phone?: string
  isOnLainDain?: boolean
}

/** Category used for grouping contacts / groups (Friend, Family, etc.) */
export interface ContactCategory {
  id: string
  name: string
  description: string
  /** Emoji icon */
  icon: string
  /** Tailwind bg class */
  bgColor: string
  /** Tailwind text class */
  iconColor: string
}

/** Steps in the New Contact / New Group multi-step flow */
export type NewFlowStep = 'choice' | 'add_members' | 'group_details' | 'success'
