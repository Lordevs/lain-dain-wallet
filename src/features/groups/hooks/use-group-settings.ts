import { useState, useMemo } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/use-auth-store'
import { useGroupQuery } from '@/features/groups/api/use-group-query'
import { useGroupBalanceQuery } from '@/features/groups/api/use-group-balance-query'
import { useUpdateGroupMutation } from '@/features/groups/api/use-update-group-mutation'
import {
  useMakeAdminMutation,
  useRemoveAdminMutation,
  useRemoveMemberMutation,
  useLeaveGroupMutation,
  useDeleteGroupMutation,
  useTransferOwnershipMutation,
} from '@/features/groups/api/use-group-actions-mutations'
import { resolveGroupRole, getGroupPermissions } from '@/features/groups/lib/group-roles'
import { initialsForName, colorForName } from '@/lib/avatar-visuals'
import { ROUTES } from '@/constants/routes'

export interface GroupMember {
  id: string
  name: string
  initials: string
  avatarColor: string
  avatar?: string | null
  balance: number
  owesText: string
  role: 'owner' | 'admin' | 'member'
  isOwner: boolean
  isAdmin: boolean
}

export interface DrawerConfig {
  type: 'outstanding' | 'confirm' | null
  title: string
  warningText?: string
  confirmTitle?: string
  confirmDescription?: string
  buttonText?: string
  buttonVariant?: 'warning' | 'danger' | 'primary'
  onAction?: () => void
  errorMessage?: string | null
  closeOnConfirm?: boolean
  disabled?: boolean
}

export interface PendingMemberAction {
  memberId: string
  label: string
}

function buildOwesText(member: Omit<GroupMember, 'owesText'>): string {
  const roleLabel = member.role === 'member' ? 'Member' : 'Admin'
  if (member.id === 'you') return `${roleLabel} · Group creator`
  if (member.balance > 0) return `${roleLabel} · Owes you Rs. ${member.balance.toLocaleString('en-US')}`
  if (member.balance < 0) return `${roleLabel} · You owe Rs. ${Math.abs(member.balance).toLocaleString('en-US')}`
  return `${roleLabel} · On Lain Dain`
}

function makeMember(partial: Omit<GroupMember, 'owesText'>): GroupMember {
  return { ...partial, owesText: buildOwesText(partial) }
}

export function useGroupSettings() {
  const { id } = useParams({ strict: false })
  const navigate = useNavigate()

  const userProfile = useAuthStore((state) => state.userProfile)
  const myId = userProfile?.id ?? ''

  const groupQuery = useGroupQuery(id)
  const balanceQuery = useGroupBalanceQuery(id)

  const group = groupQuery.data
  const isLoading = groupQuery.isLoading || balanceQuery.isLoading

  const updateGroup = useUpdateGroupMutation(id ?? '')

  const smartSettleEnabled = group?.smart_settle_enabled ?? true
  const setSmartSettleEnabled = (enabled: boolean) => {
    if (id && !updateGroup.isPending) {
      updateGroup.mutate({ smart_settle_enabled: enabled })
    }
  }

  const groupPhoto = group?.image || null
  const groupName = group?.name || ''
  const isNamePanelOpen = false

  const { isOwner, isAdmin } = getGroupPermissions(group, myId)

  const creator = group?.members.find((m) => m.id === group?.created_by)
  const creatorName = group?.created_by === myId ? 'You' : creator?.full_name || 'Owner'

  const members: GroupMember[] = useMemo(() => {
    if (!group) return []
    const balanceMap: Record<string, number> = {}
    if (Array.isArray(balanceQuery.data)) {
      balanceQuery.data.forEach((b) => {
        const net = Number(b.net_amount) || 0
        balanceMap[b.other_user.id] = b.direction === 'owed_to_you' ? net : b.direction === 'you_owe' ? -net : 0
      })
    }

    return group.members.map((m) => {
      const isMe = m.id === myId
      const role = resolveGroupRole(group, m.id)

      return makeMember({
        id: isMe ? 'you' : m.id,
        name: isMe ? 'You' : m.full_name,
        initials: initialsForName(m.full_name),
        avatarColor: colorForName(m.full_name),
        avatar: m.image ?? null,
        balance: balanceMap[m.id] ?? 0,
        role,
        isOwner: role === 'owner',
        isAdmin: role !== 'member',
      })
    })
  }, [group, balanceQuery.data, myId])

  const makeAdminMutation = useMakeAdminMutation(id ?? '')
  const removeAdminMutation = useRemoveAdminMutation(id ?? '')
  const removeMemberMutation = useRemoveMemberMutation(id ?? '')
  const leaveGroupMutation = useLeaveGroupMutation(id ?? '')
  const deleteGroupMutation = useDeleteGroupMutation(id ?? '')
  const transferOwnershipMutation = useTransferOwnershipMutation(id ?? '')

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [drawerConfig, setDrawerConfig] = useState<DrawerConfig>({
    type: null,
    title: '',
  })
  const [pendingMemberAction, setPendingMemberAction] = useState<PendingMemberAction | null>(null)

  const beginMemberAction = (memberId: string, label: string) => {
    setPendingMemberAction({ memberId, label })
  }

  const finishMemberAction = (memberId: string) => {
    setPendingMemberAction((current) => (current?.memberId === memberId ? null : current))
  }

  const selectedMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || null
  }, [members, selectedMemberId])

  const handleToggleAdmin = (memberId: string) => {
    const member = members.find((m) => m.id === memberId)
    if (!member || !id || pendingMemberAction) return
    if (member.isAdmin) {
      beginMemberAction(memberId, `Removing admin access from ${member.name}…`)
      removeAdminMutation.mutate(memberId, { onSettled: () => finishMemberAction(memberId) })
    } else {
      beginMemberAction(memberId, `Making ${member.name} an admin…`)
      makeAdminMutation.mutate(memberId, { onSettled: () => finishMemberAction(memberId) })
    }
  }

  const handleRemoveMember = (memberId: string) => {
    if (pendingMemberAction) return
    setSelectedMemberId(null)
    const member = members.find((m) => m.id === memberId)
    if (!member || !id) return

    if (member.balance !== 0) {
      // Blocking: unsettled balance means removal isn't allowed at all —
      // this just informs the admin, it never leads into the confirm-remove
      // drawer (see handleLeaveGroup's identical rule for the same reason).
      setDrawerConfig({
        type: 'outstanding',
        title: 'Permanently Remove the Member from the group',
        warningText: 'This member has unsettled balances in the group. Ask them to settle first before they can be removed.',
        buttonText: 'Got it',
        onAction: () => {},
      })
    } else {
      setDrawerConfig({
        type: 'confirm',
        title: 'Permanently Remove the Member from the group',
        confirmTitle: 'Remove the account Permanently–',
        confirmDescription: "They'll lose access to the group and its expenses. Their past contributions will remain visible to other members.",
        buttonText: 'Confirm',
        onAction: () => {
          beginMemberAction(memberId, `Removing ${member.name} from the group…`)
          removeMemberMutation.mutate(memberId, { onSettled: () => finishMemberAction(memberId) })
        },
      })
    }
  }

  const handleBlockReport = (memberId: string) => {
    const member = members.find((m) => m.id === memberId)
    if (!id || !member || pendingMemberAction) return
    beginMemberAction(memberId, `Removing ${member.name} from the group…`)
    removeMemberMutation.mutate(memberId, { onSettled: () => finishMemberAction(memberId) })
  }

  const handleLeaveGroup = () => {
    const hasBalances = members.some((m) => m.id !== 'you' && m.balance !== 0)

    if (hasBalances) {
      // Blocking: unsettled balance means you can't leave at all — this
      // sends you to actually settle up, it never leads into the
      // confirm-leave drawer (see handleRemoveMember's identical rule).
      setDrawerConfig({
        type: 'outstanding',
        title: `Leave ${groupName} Permanently`,
        warningText: `You have unsettled balances in ${groupName}. You must settle all balances before you can leave the group.`,
        buttonText: 'Settle Balance',
        onAction: () => {
          navigate({ to: ROUTES.SETTLE_UP, search: { groupId: id } })
        },
      })
    } else {
      setDrawerConfig({
        type: 'confirm',
        title: `Leave ${groupName} Permanently`,
        confirmTitle: 'Leave Group permanently?',
        confirmDescription: "You'll lose access to this group and its expenses. Other members will still see your past contributions.",
        buttonText: 'Confirm',
        onAction: async () => {
          await leaveGroupMutation.mutateAsync()
          navigate({ to: ROUTES.DASHBOARD })
        },
      })
    }
  }

  const handleDeleteGroup = () => {
    setDrawerConfig({
      type: 'confirm',
      title: 'Delete Group Permanently',
      confirmTitle: 'Delete Group permanently?',
      confirmDescription: 'This will permanently delete this group and all its expenses for all members. This action cannot be undone.',
      buttonText: 'Delete',
      buttonVariant: 'danger',
      closeOnConfirm: false,
      onAction: async () => {
        setDrawerConfig((current) => ({ ...current, errorMessage: null, disabled: true }))
        try {
          await deleteGroupMutation.mutateAsync()
          setDrawerConfig({ type: null, title: '' })
          navigate({ to: ROUTES.DASHBOARD })
        } catch (error) {
          setDrawerConfig((current) => ({
            ...current,
            disabled: false,
            errorMessage: error instanceof Error ? error.message : 'The group could not be deleted.',
          }))
        }
      },
    })
  }

  const handleTransferOwnership = (memberId: string) => {
    const targetId = memberId === 'you' ? myId : memberId
    const member = members.find((m) => m.id === memberId)
    if (!targetId || !id || !member || pendingMemberAction) return
    beginMemberAction(memberId, `Updating ${member.name}'s group access…`)
    transferOwnershipMutation.mutate(targetId, { onSettled: () => finishMemberAction(memberId) })
  }

  const groupInitials = groupName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return {
    group,
    isLoading,
    isOwner,
    isAdmin,
    creatorName,
    smartSettleEnabled,
    setSmartSettleEnabled,
    isSmartSettlePending: updateGroup.isPending,
    groupPhoto,
    groupName,
    isNamePanelOpen,
    members,
    selectedMemberId,
    setSelectedMemberId,
    drawerConfig,
    setDrawerConfig,
    selectedMember,
    pendingMemberAction,
    handleToggleAdmin,
    handleTransferOwnership,
    handleRemoveMember,
    handleBlockReport,
    handleLeaveGroup,
    handleDeleteGroup,
    groupInitials,
    navigate,
  }
}
