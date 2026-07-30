import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'

export function useMakeAdminMutation(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation<unknown, ApiError, string>({
    mutationFn: async (userId: string) => {
      const { data, error } = await apiClient.POST(
        '/api/ledger/groups/{group_id}/members/{user_id}/make-admin/',
        { params: { path: { group_id: groupId, user_id: userId } } }
      )
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useRemoveAdminMutation(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation<unknown, ApiError, string>({
    mutationFn: async (userId: string) => {
      const { data, error } = await apiClient.POST(
        '/api/ledger/groups/{group_id}/members/{user_id}/remove-admin/',
        { params: { path: { group_id: groupId, user_id: userId } } }
      )
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useRemoveMemberMutation(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation<unknown, ApiError, string>({
    mutationFn: async (userId: string) => {
      const { data, error } = await apiClient.POST(
        '/api/ledger/groups/{group_id}/members/{user_id}/remove/',
        { params: { path: { group_id: groupId, user_id: userId } } }
      )
      if (error) throw toApiError(error)
      return data
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
      const { error } = await apiClient.POST(
        '/api/ledger/groups/{group_id}/leave/',
        { params: { path: { group_id: groupId } } }
      )
      if (error) throw toApiError(error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'list'] })
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
      const { error } = await apiClient.DELETE(
        '/api/ledger/groups/{id}/',
        { params: { path: { id: groupId } } }
      )
      if (error) throw toApiError(error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['user-ledgers'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useInviteMembersMutation(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation<unknown, ApiError, string[]>({
    mutationFn: async (memberIds: string[]) => {
      const { data, error } = await apiClient.POST(
        '/api/ledger/groups/{group_id}/invitations/',
        {
          params: { path: { group_id: groupId } },
          body: { member_ids: memberIds },
        }
      )
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

/** Keyed by the invited user's id (not a separate invitation id) — that's
 * all the merged active/pending member list (GroupParticipant) exposes. */
export function useCancelInvitationMutation(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation<unknown, ApiError, string>({
    mutationFn: async (userId: string) => {
      const { data, error } = await apiClient.POST(
        '/api/ledger/groups/{group_id}/invitations/{user_id}/cancel/',
        { params: { path: { group_id: groupId, user_id: userId } } }
      )
      if (error) throw toApiError(error)
      return data
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
      const { data, error } = await apiClient.POST(
        '/api/ledger/groups/{group_id}/members/{user_id}/transfer-ownership/',
        { params: { path: { group_id: groupId, user_id: userId } } }
      )
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
