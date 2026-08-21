import { onlineManager } from '@tanstack/react-query'
import { env } from '@/lib/env'
import { refreshAccessToken } from '@/lib/api/client'
import type { components } from '@/lib/api/schema'
import { useAuthStore } from '@/store/use-auth-store'
import { replaceResourceSnapshot } from '@/lib/sqlite/resource-snapshot-store'

interface OfflineSnapshot {
  profile: components['schemas']['User']
  groups: components['schemas']['Group'][]
  settlements: components['schemas']['SettlementRead'][]
  recurring_expenses: components['schemas']['RecurringExpenseRead'][]
  notifications: components['schemas']['Notification'][]
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
      replaceResourceSnapshot(ownerId, 'settlements', snapshot.settlements.map((item) => ({
        id: item.id, scopeId: item.group ?? item.friendship ?? null, data: item,
      }))),
      replaceResourceSnapshot(ownerId, 'recurring', snapshot.recurring_expenses.map((item) => ({
        id: item.id, scopeId: item.group ?? item.friendship ?? null, data: item,
      }))),
      replaceResourceSnapshot(ownerId, 'notifications', snapshot.notifications.map((item) => ({ id: item.id, data: item }))),
    ])
  } finally {
    pulling = false
  }
}
