import { useState, useMemo } from 'react'
import { useAuthStore } from '@/store/use-auth-store'
import { getInitials } from '@/lib/utils'

export interface SplitData {
  type: 'equal' | 'unequal' | 'adjustment'
  selectedMembers: string[]
  unequalAmounts: Record<string, number>
  adjustmentAmounts: Record<string, number>
}

export interface SplitMember {
  id: string
  name: string
  initials: string
  avatarColor: string
  isOrganizer: boolean
}

export function getInitialSplitState(
  members: SplitMember[],
  initialSplitData: SplitData | null,
  amount: number
): {
  splitType: 'equal' | 'unequal' | 'adjustment'
  selectedMembers: string[]
  unequalAmounts: Record<string, string>
  adjustmentAmounts: Record<string, string>
} {
  if (initialSplitData) {
    const unequalAmounts: Record<string, string> = {}
    const adjustmentAmounts: Record<string, string> = {}
    members.forEach((m) => {
      unequalAmounts[m.id] = String(initialSplitData.unequalAmounts[m.id] ?? 0)
      adjustmentAmounts[m.id] = String(initialSplitData.adjustmentAmounts[m.id] ?? 0)
    })
    return {
      splitType: initialSplitData.type,
      selectedMembers: initialSplitData.selectedMembers,
      unequalAmounts,
      adjustmentAmounts,
    }
  }

  const defaultShare = String(Math.round(amount / members.length))
  const unequalAmounts: Record<string, string> = {}
  const adjustmentAmounts: Record<string, string> = {}
  members.forEach((m) => {
    unequalAmounts[m.id] = defaultShare
    adjustmentAmounts[m.id] = '0'
  })
  return {
    splitType: 'equal',
    selectedMembers: members.map((m) => m.id),
    unequalAmounts,
    adjustmentAmounts,
  }
}

export function useSplitExpense({
  amount,
  contactName = '',
  contactInitials = '',
  contactAvatarColor = '',
  members: membersProp,
  initialSplitData,
  onSave,
}: {
  amount: number
  /** Only meaningful when `members` is omitted (1:1 contact mode). */
  contactName?: string
  contactInitials?: string
  contactAvatarColor?: string
  /** Real member list (you first, then everyone else) for a group expense —
   * when provided this replaces the 2-person contact-based list below. */
  members?: SplitMember[]
  initialSplitData: SplitData | null
  onSave: (splitData: SplitData) => void
}) {
  const userProfile = useAuthStore((state) => state.userProfile)
  const youInitials = getInitials(userProfile?.name || 'You')

  const members = useMemo(() => {
    if (membersProp) return membersProp
    return [
      { id: 'you', name: 'You', initials: youInitials, avatarColor: 'bg-positive', isOrganizer: true },
      { id: 'contact', name: contactName, initials: contactInitials, avatarColor: contactAvatarColor || 'bg-[#2F80ED]', isOrganizer: false },
    ]
  }, [membersProp, contactName, contactInitials, contactAvatarColor, youInitials])

  const initial = getInitialSplitState(members, initialSplitData, amount)
  const [splitType, setSplitType] = useState<'equal' | 'unequal' | 'adjustment'>(initial.splitType)
  const [selectedMembers, setSelectedMembers] = useState<string[]>(initial.selectedMembers)
  const [unequalAmounts, setUnequalAmounts] = useState<Record<string, string>>(initial.unequalAmounts)
  const [adjustmentAmounts, setAdjustmentAmounts] = useState<Record<string, string>>(initial.adjustmentAmounts)

  const totalAmount = amount || 0

  // 1. Equal Split calculation
  const numSelected = selectedMembers.length
  const equalSplitAmount = numSelected > 0 ? Math.round(totalAmount / numSelected) : 0

  // 2. Unequal Split validation
  const unequalSum = members.reduce((sum, m) => sum + (Number(unequalAmounts[m.id]) || 0), 0)
  const unequalRemaining = totalAmount - unequalSum

  // 3. Adjustment Split calculation
  const totalAdjustments = members.reduce((sum, m) => sum + (Number(adjustmentAmounts[m.id]) || 0), 0)
  const baseSplitAmount = Math.max(0, totalAmount - totalAdjustments)
  const basePerPerson = Math.round(baseSplitAmount / members.length)

  const getAdjustmentFinalAmount = (memberId: string) => {
    const adjVal = Number(adjustmentAmounts[memberId]) || 0
    return basePerPerson + adjVal
  }

  const handleToggleEqualMember = (memberId: string) => {
    setSelectedMembers((prev) => {
      if (prev.includes(memberId)) {
        if (prev.length === 1) return prev
        return prev.filter((m) => m !== memberId)
      } else {
        return [...prev, memberId]
      }
    })
  }

  const handleUnequalChange = (memberId: string, val: string) => {
    const rawVal = val.replace(/\D/g, '')
    const numVal = Number(rawVal) || 0
    const otherSum = members
      .filter((m) => m.id !== memberId)
      .reduce((sum, m) => sum + (Number(unequalAmounts[m.id]) || 0), 0)
    const maxAllowed = Math.max(0, totalAmount - otherSum)
    const cappedVal = numVal > maxAllowed ? maxAllowed.toString() : rawVal
    setUnequalAmounts((prev) => ({
      ...prev,
      [memberId]: cappedVal,
    }))
  }

  const handleAdjustmentChange = (memberId: string, val: string) => {
    const rawVal = val.replace(/\D/g, '')
    const numVal = Number(rawVal) || 0
    const otherSum = members
      .filter((m) => m.id !== memberId)
      .reduce((sum, m) => sum + (Number(adjustmentAmounts[m.id]) || 0), 0)
    const maxAllowed = Math.max(0, totalAmount - otherSum)
    const cappedVal = numVal > maxAllowed ? maxAllowed.toString() : rawVal
    setAdjustmentAmounts((prev) => ({
      ...prev,
      [memberId]: cappedVal,
    }))
  }

  const handleResetUnequal = () => {
    const resetValues: Record<string, string> = {}
    members.forEach((m) => {
      resetValues[m.id] = '0'
    })
    setUnequalAmounts(resetValues)
  }

  const handleResetAdjustment = () => {
    const resetValues: Record<string, string> = {}
    members.forEach((m) => {
      resetValues[m.id] = '0'
    })
    setAdjustmentAmounts(resetValues)
  }

  const handleConfirm = () => {
    if (splitType === 'unequal' && unequalRemaining !== 0) return

    const dynamicUnequal: Record<string, number> = {}
    const dynamicAdjustment: Record<string, number> = {}

    members.forEach((m) => {
      dynamicUnequal[m.id] = splitType === 'unequal'
        ? (Number(unequalAmounts[m.id]) || 0)
        : splitType === 'equal' && selectedMembers.includes(m.id)
          ? equalSplitAmount
          : 0

      dynamicAdjustment[m.id] = splitType === 'adjustment'
        ? (Number(adjustmentAmounts[m.id]) || 0)
        : 0
    })

    onSave({
      type: splitType,
      selectedMembers: splitType === 'equal' ? selectedMembers : members.map((m) => m.id),
      unequalAmounts: dynamicUnequal,
      adjustmentAmounts: dynamicAdjustment,
    })
  }

  return {
    members,
    splitType,
    setSplitType,
    selectedMembers,
    setSelectedMembers,
    unequalAmounts,
    setUnequalAmounts,
    adjustmentAmounts,
    setAdjustmentAmounts,
    totalAmount,
    numSelected,
    equalSplitAmount,
    unequalSum,
    unequalRemaining,
    totalAdjustments,
    baseSplitAmount,
    basePerPerson,
    getAdjustmentFinalAmount,
    handleToggleEqualMember,
    handleUnequalChange,
    handleAdjustmentChange,
    handleResetUnequal,
    handleResetAdjustment,
    handleConfirm,
  }
}
