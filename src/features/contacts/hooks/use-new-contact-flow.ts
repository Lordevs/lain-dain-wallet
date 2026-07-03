import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ROUTES } from '@/constants/routes'
import { MOCK_CATEGORIES } from '../data/mock-data'
import { useContactStore, type Contact } from '@/store/use-contact-store'
import type { NewFlowStep } from '../types'

// ─── Public interface of the hook ─────────────────────────────────────────────

export interface NewContactFlowState {
  // ── Step navigation ─────────────────────────────────────────────────────────
  step: NewFlowStep
  setStep: (step: NewFlowStep) => void
  goBack: () => void

  // ── Contact selection ────────────────────────────────────────────────────────
  selectedContacts: string[]
  /** Full contact objects matching selectedContacts ids */
  selectedList: Contact[]
  /** MOCK_CONTACTS filtered by current searchQuery */
  filteredContacts: Contact[]
  toggleContact: (id: string) => void
  removeContact: (id: string) => void

  // ── Search ──────────────────────────────────────────────────────────────────
  searchQuery: string
  setSearchQuery: (v: string) => void

  // ── Group form ───────────────────────────────────────────────────────────────
  groupName: string
  setGroupName: (v: string) => void
  description: string
  setDescription: (v: string) => void
  currency: string
  setCurrency: (v: string) => void
  selectedCategory: string
  setSelectedCategory: (v: string) => void
  groupAvatar: string | null
  setGroupAvatar: (v: string | null) => void

  // ── Step actions ─────────────────────────────────────────────────────────────
  /** Advance from add_members → group_details (no-op if nothing selected) */
  nextStep: () => void
  /** Advance from group_details → success (no-op if groupName is empty) */
  createGroup: () => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useNewContactFlow — owns all state and logic for the New Contact / New Group
 * multi-step flow. The orchestrator screen and each step component consume this
 * via prop drilling (avoids context overhead for a single-screen flow).
 */
export function useNewContactFlow(): NewContactFlowState {
  const navigate = useNavigate()
  const contacts = useContactStore((state) => state.contacts)
  const addContact = useContactStore((state) => state.addContact)

  const [step, setStep] = useState<NewFlowStep>('choice')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')
  const [currency, setCurrency] = useState('pkr')
  const [selectedCategory, setSelectedCategory] = useState(MOCK_CATEGORIES[0].id)
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null)

  // ── Derived ──────────────────────────────────────────────────────────────────

  const selectableContacts = contacts.filter((c) => c.type === 'person')

  const filteredContacts = selectableContacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const selectedList = contacts.filter((c) => selectedContacts.includes(c.id))

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const toggleContact = (id: string) => {
    if (step === 'choice') {
      // Single selection on the choice step
      setSelectedContacts((prev) => (prev.includes(id) ? [] : [id]))
    } else {
      // Multiple selection on the group member selection step
      setSelectedContacts((prev) =>
        prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id],
      )
    }
  }

  const removeContact = (id: string) =>
    setSelectedContacts((prev) => prev.filter((cId) => cId !== id))

  const goBack = () => {
    if (step === 'success') {
      if (selectedContacts.length === 1 && !groupName) {
        setStep('choice')
      } else {
        navigate({ to: ROUTES.DASHBOARD })
      }
    } else if (step === 'group_details') {
      setStep('add_members')
    } else if (step === 'add_members') {
      setStep('choice')
    } else {
      navigate({ to: ROUTES.DASHBOARD })
    }
  }

  const nextStep = () => {
    if (selectedContacts.length > 0) {
      if (step === 'choice') {
        setStep('success')
      } else {
        setStep('group_details')
      }
    }
  }

  const createGroup = () => {
    if (groupName.trim()) {
      const newGroup: Contact = {
        id: 'g-' + Date.now(),
        name: groupName,
        initials: groupName.slice(0, 2).toUpperCase(),
        avatarColor: groupAvatar || 'bg-[#01592B]',
        ledgerCount: selectedContacts.length + 1,
        netAmount: 0,
        tags: [],
        type: 'group',
      }
      addContact(newGroup)
      setStep('success')
    }
  }

  return {
    step,
    setStep,
    goBack,
    selectedContacts,
    selectedList,
    filteredContacts,
    toggleContact,
    removeContact,
    searchQuery,
    setSearchQuery,
    groupName,
    setGroupName,
    description,
    setDescription,
    currency,
    setCurrency,
    selectedCategory,
    setSelectedCategory,
    groupAvatar,
    setGroupAvatar,
    nextStep,
    createGroup,
  }
}
