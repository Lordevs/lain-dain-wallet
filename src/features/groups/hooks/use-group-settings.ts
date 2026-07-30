import { useState, useMemo, useRef, useEffect } from 'react'
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
  isPending: boolean
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
}

function buildOwesText(member: Omit<GroupMember, 'owesText'>): string {
  const roleLabel = member.role === 'owner' ? 'Owner' : member.role === 'admin' ? 'Admin' : 'Member'
  if (member.id === 'you') return `${roleLabel} · Group creator`
  if (member.isPending) return 'Member · Invited via link'
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
    if (id) {
      updateGroup.mutate({ smart_settle_enabled: enabled })
    }
  }

  const groupPhoto = group?.image || null
  const groupName = group?.name || ''
  const isNamePanelOpen = false

  const myMember = group?.members.find((m) => m.id === myId)
  const hasOwnerRole = group?.members.some((mem) => mem.role === 'owner')
  const isOwner = hasOwnerRole ? myMember?.role === 'owner' : group?.created_by === myId
  const isAdmin = isOwner || myMember?.role === 'admin'

  const creator = group?.members.find((m) => m.id === group?.created_by)
  const creatorName = group?.created_by === myId ? 'You' : creator?.full_name || 'Owner'

  const [members, setMembers] = useState<GroupMember[]>([])

  useEffect(() => {
    if (!group) return
    const balanceMap: Record<string, number> = {}
    if (Array.isArray(balanceQuery.data)) {
      balanceQuery.data.forEach((b) => {
        const net = Number(b.net_amount) || 0
        balanceMap[b.other_user.id] = b.direction === 'owed_to_you' ? net : b.direction === 'you_owe' ? -net : 0
      })
    }
    const hasGroupOwner = group.members.some((mem) => mem.role === 'owner')

    const apiMembers: GroupMember[] = group.members.map((m) => {
      const isMe = m.id === myId
      const name = isMe ? 'You' : m.full_name
      const bal = balanceMap[m.id] ?? 0
      const memberIsOwner = hasGroupOwner ? m.role === 'owner' : m.id === group.created_by
      const memberIsAdmin = memberIsOwner || m.role === 'admin'
      const role: 'owner' | 'admin' | 'member' = memberIsOwner
        ? 'owner'
        : m.role === 'admin'
        ? 'admin'
        : 'member'

      return makeMember({
        id: isMe ? 'you' : m.id,
        name,
        initials: initialsForName(m.full_name),
        avatarColor: colorForName(m.full_name),
        avatar: m.image ?? null,
        balance: bal,
        role,
        isOwner: memberIsOwner,
        isAdmin: memberIsAdmin,
        isPending: m.status === 'pending',
      })
    })
    setMembers(apiMembers)
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

  const pendingAfterClose = useRef<(() => void) | null>(null)

  const selectedMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || null
  }, [members, selectedMemberId])

  const handleToggleAdmin = (memberId: string) => {
    const member = members.find((m) => m.id === memberId)
    if (!member || !id) return
    if (member.isAdmin) {
      removeAdminMutation.mutate(memberId)
    } else {
      makeAdminMutation.mutate(memberId)
    }
  }

  const handleRemoveMember = (memberId: string) => {
    setSelectedMemberId(null)
    const member = members.find((m) => m.id === memberId)
    if (!member || !id) return

    if (member.balance !== 0) {
      setDrawerConfig({
        type: 'outstanding',
        title: 'Permanently Remove the Member from the group',
        warningText: 'This member has unsettled balances in the group. Ask them to settle first before they can be removed.',
        buttonText: 'Settle Balance',
        onAction: () => {
          pendingAfterClose.current = () => {
            setDrawerConfig({
              type: 'confirm',
              title: 'Permanently Remove the Member from the group',
              confirmTitle: 'Remove the account Permanently–',
              confirmDescription: "They'll lose access to the group and its expenses. Their past contributions will remain visible to other members.",
              buttonText: 'Confirm',
              onAction: () => {
                removeMemberMutation.mutate(memberId)
              },
            })
          }
        },
      })
    } else {
      setDrawerConfig({
        type: 'confirm',
        title: 'Permanently Remove the Member from the group',
        confirmTitle: 'Remove the account Permanently–',
        confirmDescription: "They'll lose access to the group and its expenses. Their past contributions will remain visible to other members.",
        buttonText: 'Confirm',
        onAction: () => {
          removeMemberMutation.mutate(memberId)
        },
      })
    }
  }

  const handleBlockReport = (memberId: string) => {
    if (!id) return
    removeMemberMutation.mutate(memberId)
  }

  const handleLeaveGroup = () => {
    const hasBalances = members.some((m) => m.id !== 'you' && m.balance !== 0)

    if (hasBalances) {
      setDrawerConfig({
        type: 'outstanding',
        title: `Leave ${groupName} Permanently`,
        warningText: `You have unsettled balances in ${groupName}. You must settle all balances before you can leave the group.`,
        buttonText: 'Settle Balance',
        onAction: () => {
          pendingAfterClose.current = () => {
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
      onAction: async () => {
        await deleteGroupMutation.mutateAsync()
        navigate({ to: ROUTES.DASHBOARD })
      },
    })
  }

  const handleTransferOwnership = (memberId: string) => {
    const targetId = memberId === 'you' ? myId : memberId
    if (!targetId || !id) return
    transferOwnershipMutation.mutate(targetId)
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
    groupPhoto,
    groupName,
    isNamePanelOpen,
    members,
    selectedMemberId,
    setSelectedMemberId,
    drawerConfig,
    setDrawerConfig,
    pendingAfterClose,
    selectedMember,
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
