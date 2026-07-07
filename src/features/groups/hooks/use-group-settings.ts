import { useState, useMemo, useRef } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useContactStore } from '@/store/use-contact-store'
import { ROUTES } from '@/constants/routes'

export interface GroupMember {
  id: string
  name: string
  initials: string
  avatarColor: string
  balance: number
  owesText: string
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
  if (member.id === 'you') return 'Admin · Group creator'
  if (member.isPending) return 'Member · Invited via link'
  if (member.balance > 0) return `Member · Owes you Rs. ${member.balance.toLocaleString('en-US')}`
  if (member.balance < 0) return `Member · You owe Rs. ${Math.abs(member.balance).toLocaleString('en-US')}`
  return `${member.isAdmin ? 'Admin' : 'Member'} · On Lain Dain`
}

function makeMember(partial: Omit<GroupMember, 'owesText'>): GroupMember {
  return { ...partial, owesText: buildOwesText(partial) }
}

export function useGroupSettings() {
  const { id } = useParams({ from: '/groups/$id/settings' })
  const navigate = useNavigate({ from: '/groups/$id/settings' })

  const contacts = useContactStore((state) => state.contacts)
  const contact = useMemo(() => {
    return contacts.find((c) => c.id === id)
  }, [id, contacts])

  const [smartSettleEnabled, setSmartSettleEnabled] = useState(true)
  const groupPhoto = contact?.avatar || null
  const groupName = contact?.name || 'Murree Trip'
  const isNamePanelOpen = false

  const [members, setMembers] = useState<GroupMember[]>([
    makeMember({ id: 'you', name: 'You', initials: 'MH', avatarColor: 'bg-positive text-white', balance: 0, isAdmin: true, isPending: false }),
    makeMember({ id: 'ali', name: 'Ali Hassan', initials: 'AH', avatarColor: 'bg-[#2F80ED] text-white', balance: 2000, isAdmin: false, isPending: false }),
    makeMember({ id: 'sara', name: 'Sara Khan', initials: 'SK', avatarColor: 'bg-[#C96A1B] text-white', balance: 0, isAdmin: true, isPending: false }),
    makeMember({ id: 'hassan', name: 'Hassan', initials: 'HS', avatarColor: 'bg-[#4F5D75] text-white', balance: 0, isAdmin: false, isPending: false }),
    makeMember({ id: 'usman', name: 'Usman Shah', initials: 'US', avatarColor: 'bg-[#5C6BC0] text-white', balance: 0, isAdmin: false, isPending: true }),
  ])

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
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m
        const nextAdmin = !m.isAdmin
        const updated = { ...m, isAdmin: nextAdmin }
        return { ...updated, owesText: buildOwesText(updated) }
      })
    )
  }

  const handleRemoveMember = (memberId: string) => {
    setSelectedMemberId(null)
    const member = members.find((m) => m.id === memberId)
    if (!member) return

    if (member.balance !== 0) {
      setDrawerConfig({
        type: 'outstanding',
        title: 'Permanently Remove the Member from the group',
        warningText: 'This member has unsettled balances in the group. Ask them to settle first before they can be removed.',
        buttonText: 'Settle Balance',
        onAction: () => {
          setMembers((prev) =>
            prev.map((m) => {
              if (m.id !== memberId) return m
              const updated = { ...m, balance: 0 }
              return { ...updated, owesText: buildOwesText(updated) }
            })
          )
          pendingAfterClose.current = () => {
            setDrawerConfig({
              type: 'confirm',
              title: 'Permanently Remove the Member from the group',
              confirmTitle: 'Remove the account Permanently–',
              confirmDescription: "They'll lose access to the group and its expenses. Their past contributions will remain visible to other members.",
              buttonText: 'Confirm',
              onAction: () => {
                setMembers((prev) => prev.filter((m) => m.id !== memberId))
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
          setMembers((prev) => prev.filter((m) => m.id !== memberId))
        },
      })
    }
  }

  const handleBlockReport = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
  }

  const handleLeaveGroup = () => {
    const hasBalances = members.some((m) => m.id !== 'you' && m.balance > 0)

    if (hasBalances) {
      setDrawerConfig({
        type: 'outstanding',
        title: 'Leave the Murree Group Permanently',
        warningText: `You have unsettled balances in ${groupName}. You must settle all balances before you can leave the group.`,
        buttonText: 'Settle Balance',
        onAction: () => {
          setMembers((prev) =>
            prev.map((m) => {
              if (m.balance <= 0) return m
              const updated = { ...m, balance: 0 }
              return { ...updated, owesText: buildOwesText(updated) }
            })
          )
          pendingAfterClose.current = () => {
            setDrawerConfig({
              type: 'confirm',
              title: 'Leave the Murree Group Permanently',
              confirmTitle: 'Leave Group permanently?',
              confirmDescription: "You'll lose access to this group and its expenses. Other members will still see your past contributions.",
              buttonText: 'Confirm',
              onAction: () => navigate({ to: ROUTES.DASHBOARD }),
            })
          }
        },
      })
    } else {
      setDrawerConfig({
        type: 'confirm',
        title: 'Leave the Murree Group Permanently',
        confirmTitle: 'Leave Group permanently?',
        confirmDescription: "You'll lose access to this group and its expenses. Other members will still see your past contributions.",
        buttonText: 'Confirm',
        onAction: () => navigate({ to: ROUTES.DASHBOARD }),
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
      onAction: () => {
        if (contact) {
          useContactStore.getState().deleteContact(contact.id)
        }
        navigate({ to: ROUTES.DASHBOARD })
      },
    })
  }

  const groupInitials = groupName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return {
    contact,
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
    handleRemoveMember,
    handleBlockReport,
    handleLeaveGroup,
    handleDeleteGroup,
    groupInitials,
    navigate,
  }
}
