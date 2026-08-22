import { onlineManager } from '@tanstack/react-query'
import { env } from '@/lib/env'
import { refreshAccessToken } from '@/lib/api/client'
import type { components } from '@/lib/api/schema'
import { useAuthStore } from '@/store/use-auth-store'
import { replaceResourceSnapshot } from '@/lib/sqlite/resource-snapshot-store'

/** One raw CategoryBudget row (apps.expenses.CategoryBudget via the
 * backend's CategoryBudgetSerializer). Not a generated schema type — the
 * snapshot endpoint's response isn't OpenAPI-typed; kept in sync with the
 * serializer by hand. */
export interface SnapshotCategoryBudget {
  id: string
  category: components['schemas']['Category']
  limit_amount: string
}

interface OfflineSnapshot {
  profile: components['schemas']['User']
  groups: components['schemas']['Group'][]
  friendships: components['schemas']['Friendship'][]
  categories: components['schemas']['Category'][]
  personal_expense_settings: components['schemas']['PersonalExpenseSettings']
  settlements: components['schemas']['SettlementRead'][]
  recurring_expenses: components['schemas']['RecurringExpenseRead'][]
  notifications: components['schemas']['Notification'][]
  category_budgets: SnapshotCategoryBudget[]
}

let pulling = false

export async function pullOfflineSnapshot(): Promise<void> {
  if (pulling || !onlineManager.isOnline()) return
  const ownerId = useAuthStore.getState().userProfile?.id
  if (!ownerId) return
  pulling = true
  try {
    let token = useAuthStore.getState().accessToken
    const send = () => fetch(`${env.apiBaseUrl}/api/sync/snapshot/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    let response = await send()
    if (response.status === 401) {
      token = await refreshAccessToken()
      if (token) response = await send()
    }
    if (!response.ok) return
    const snapshot = await response.json() as OfflineSnapshot
    await Promise.all([
      replaceResourceSnapshot(ownerId, 'profile', [{ id: ownerId, data: snapshot.profile }]),
      replaceResourceSnapshot(ownerId, 'groups', snapshot.groups.map((group) => ({ id: group.id, data: group }))),
      replaceResourceSnapshot(ownerId, 'friendships', snapshot.friendships.map((item) => ({ id: item.id, data: item }))),
      replaceResourceSnapshot(ownerId, 'categories', snapshot.categories.map((item) => ({ id: item.id, data: item }))),
      replaceResourceSnapshot(ownerId, 'personal-settings', [{
        id: ownerId, data: snapshot.personal_expense_settings,
      }]),
      replaceResourceSnapshot(ownerId, 'settlements', snapshot.settlements.map((item) => ({
        id: item.id, scopeId: item.group ?? item.friendship ?? null, data: item,
      }))),
      replaceResourceSnapshot(ownerId, 'recurring', snapshot.recurring_expenses.map((item) => ({
        id: item.id, scopeId: item.group ?? item.friendship ?? null, data: item,
      }))),
      replaceResourceSnapshot(ownerId, 'notifications', snapshot.notifications.map((item) => ({ id: item.id, data: item }))),
      // Raw budget-limit rows, scoped by category — distinct resource key
      // from 'category-budgets', which stores the per-period *overview*
      // responses the budgets query hook caches itself.
      replaceResourceSnapshot(ownerId, 'budget-limits', snapshot.category_budgets.map((budget) => ({
        id: budget.id, scopeId: budget.category.id, data: budget,
      }))),
    ])
  } finally {
    pulling = false
  }
}
