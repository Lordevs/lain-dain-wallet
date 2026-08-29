import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { deleteSnapshotRecord, getSnapshotRecord, upsertSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import { useAuthStore } from '@/store/use-auth-store'

type Group = components['schemas']['Group']

async function queueGroupAction(
  queryClient: ReturnType<typeof useQueryClient>,
  groupId: string,
  path: string,
  body?: unknown,
): Promise<Group> {
  const ownerId = useAuthStore.getState().userProfile?.id
  const current = queryClient.getQueryData<Group>(['group', groupId])
    ?? (ownerId ? await getSnapshotRecord<Group>(ownerId, 'groups', groupId) : null)
  if (!current) throw new ApiError('Open this group online once before changing it offline.')
  const result = await queueMutation({
    resource: 'groups', method: 'POST', path, body, optimisticResult: current,
  })
  if (ownerId) await upsertSnapshotRecord(ownerId, 'groups', { id: groupId, data: result.data })
  return result.data
}

export function useMakeAdminMutation(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation<unknown, ApiError, string>({
    mutationFn: async (userId: string) => {
      return queueGroupAction(queryClient, groupId, `/api/ledger/groups/${groupId}/members/${userId}/make-admin/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
    },
  })
}

export function useRemoveAdminMutation(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation<unknown, ApiError, string>({
    mutationFn: async (userId: string) => {
      return queueGroupAction(queryClient, groupId, `/api/ledger/groups/${groupId}/members/${userId}/remove-admin/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
    },
  })
}

export function useRemoveMemberMutation(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation<unknown, ApiError, string>({
    mutationFn: async (userId: string) => {
      return queueGroupAction(queryClient, groupId, `/api/ledger/groups/${groupId}/members/${userId}/remove/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      queryClient.invalidateQueries({ queryKey: ['group-balance', groupId] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useLeaveGroupMutation(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      await queueMutation({ resource: 'groups', method: 'POST', path: `/api/ledger/groups/${groupId}/leave/`, optimisticResult: undefined })
      const ownerId = useAuthStore.getState().userProfile?.id
      if (ownerId) await deleteSnapshotRecord(ownerId, 'groups', groupId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'list'] })
      // Leaving can change every other member's combined ledger view with
      // you, and the member list isn't available here (nor safely
      // fetchable — you're no longer a member the moment this succeeds) —
      // broad invalidation is the correct behavior, just not maximally
      // scoped.
      queryClient.invalidateQueries({ queryKey: ['user-ledgers'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteGroupMutation(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      await queueMutation({ resource: 'groups', method: 'DELETE', path: `/api/ledger/groups/${groupId}/`, optimisticResult: undefined })
      const ownerId = useAuthStore.getState().userProfile?.id
      if (ownerId) await deleteSnapshotRecord(ownerId, 'groups', groupId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'list'] })
      // Same reasoning as useLeaveGroupMutation above — deleting can
      // change every other member's combined ledger view, member list
      // isn't available here, broad invalidation is correct as-is.
      queryClient.invalidateQueries({ queryKey: ['user-ledgers'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}

/** POST /api/ledger/groups/{id}/invitations/ — adds members immediately,
 * no consent step (URL path kept as "invitations" for backward
 * compatibility with this exact call site; see
 * apps.ledger.services.add_members on the backend). */
export function useAddMembersMutation(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation<unknown, ApiError, string[]>({
    mutationFn: async (memberIds: string[]) => {
      return queueGroupAction(queryClient, groupId, `/api/ledger/groups/${groupId}/invitations/`, { member_ids: memberIds })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useTransferOwnershipMutation(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation<unknown, ApiError, string>({
    mutationFn: async (userId: string) => {
      return queueGroupAction(queryClient, groupId, `/api/ledger/groups/${groupId}/members/${userId}/transfer-ownership/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
