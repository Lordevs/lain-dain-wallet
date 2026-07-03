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
  contactName,
  contactInitials,
  contactAvatarColor,
  initialSplitData,
  onSave,
}: {
  amount: number
  contactName: string
  contactInitials: string
  contactAvatarColor: string
  initialSplitData: SplitData | null
  onSave: (splitData: SplitData) => void
}) {
  const userProfile = useAuthStore((state) => state.userProfile)
  const youInitials = getInitials(userProfile?.name || 'You')

  const isGroup = useMemo(() => {
    return (
      contactName.toLowerCase().includes('trip') ||
      contactName.toLowerCase().includes('family') ||
      contactName.toLowerCase().includes('group')
    )
  }, [contactName])

  const members = useMemo(() => {
    return isGroup
      ? [
          { id: 'you', name: 'You', initials: youInitials, avatarColor: 'bg-positive', isOrganizer: true },
          { id: 'ali', name: 'Ali Hassan', initials: 'AH', avatarColor: 'bg-[#2F80ED]', isOrganizer: false },
          { id: 'sara', name: 'Sara Khan', initials: 'SK', avatarColor: 'bg-orange-payable', isOrganizer: false },
          { id: 'hassan', name: 'Hassan', initials: 'HS', avatarColor: 'bg-[#475569]', isOrganizer: false },
        ]
      : [
          { id: 'you', name: 'You', initials: youInitials, avatarColor: 'bg-positive', isOrganizer: true },
          { id: 'contact', name: contactName, initials: contactInitials, avatarColor: contactAvatarColor || 'bg-[#2F80ED]', isOrganizer: false },
        ]
  }, [isGroup, contactName, contactInitials, contactAvatarColor, youInitials])

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
    setUnequalAmounts((prev) => ({
      ...prev,
      [memberId]: rawVal,
    }))
  }

  const handleAdjustmentChange = (memberId: string, val: string) => {
    const rawVal = val.replace(/\D/g, '')
    setAdjustmentAmounts((prev) => ({
      ...prev,
      [memberId]: rawVal,
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
    isGroup,
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
