import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ROUTES } from '@/constants/routes'
import { MOCK_CATEGORIES } from '../data/mock-data'
import type { Contact } from '@/store/use-contact-store'
import type { NewFlowStep } from '../types'
import { useContactsQuery } from '@/features/contacts/api/use-contacts-query'
import { useCreateFriendshipMutation } from '@/features/contacts/api/use-friendship-mutations'
import { useCreateGroupMutation } from '@/features/contacts/api/use-create-group-mutation'
import { mapSyncedContact } from '@/features/contacts/lib/map-synced-contact'
import { parseCurrencyMismatch, type CurrencyMismatch } from '@/features/contacts/lib/parse-currency-mismatch'
import { colorForName, initialsForName } from '@/lib/avatar-visuals'
import { useAuthStore } from '@/store/use-auth-store'
import { useDeviceContactsSync, type ContactsSyncStatus } from './use-device-contacts-sync'

// ─── Public interface of the hook ─────────────────────────────────────────────

/** Onscroll-fetch state for one independently-paginated list — wire to
 * <InfiniteScrollSentinel> at the end of that list. */
export interface ContactsPage {
  hasMore: boolean
  isFetchingMore: boolean
  fetchMore: () => void
}

export interface NewContactFlowState {
  // ── Step navigation ─────────────────────────────────────────────────────────
  step: NewFlowStep
  setStep: (step: NewFlowStep) => void
  goBack: () => void

  // ── Device contacts sync ────────────────────────────────────────────────────
  syncStatus: ContactsSyncStatus
  isSyncing: boolean
  syncError: string | null
  requestContactsAccess: () => Promise<boolean>

  // ── Contact selection ────────────────────────────────────────────────────────
  selectedContacts: string[]
  /** Full contact objects matching selectedContacts ids */
  selectedList: Contact[]
  /** On-app contacts matching current searchQuery — independently paginated */
  filteredContacts: Contact[]
  onAppContactsPage: ContactsPage
  /** Not-yet-on-the-app contacts matching current searchQuery — invite only,
   * never selectable, independently paginated from the on-app list */
  inviteContacts: Contact[]
  inviteContactsPage: ContactsPage
  isLoadingContacts: boolean
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
  currencyRates: Record<string, string>
  setCurrencyRate: (currency: string, rate: string) => void
  selectedCategory: string
  setSelectedCategory: (v: string) => void
  groupAvatar: string | null
  setGroupAvatar: (v: string | null) => void

  // ── Step actions ─────────────────────────────────────────────────────────────
  /** Advance from choice → success (creates the Friendship) or add_members → group_details */
  nextStep: () => void
  /** Creates the real Group, then advances to success */
  createGroup: () => void
  isSubmitting: boolean
  submitError: string | null

  // ── Currency mismatch (1:1 ledger start) ────────────────────────────────────
  /** Non-null when starting a 1:1 ledger hit a currency mismatch — open
   * <CurrencyMismatchDrawer> bound to this. */
  currencyMismatch: CurrencyMismatch | null
  closeCurrencyMismatch: () => void
  /** Retries friendship creation with the user's chosen currency/rate */
  resolveCurrencyMismatch: (currency: string, exchangeRate: string) => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useNewContactFlow — owns all state and logic for the New Contact / New Group
 * multi-step flow. The orchestrator screen and each step component consume this
 * via prop drilling (avoids context overhead for a single-screen flow).
 */
export function useNewContactFlow(): NewContactFlowState {
  const navigate = useNavigate()
  const ownPhone = useAuthStore((state) => state.userProfile?.phone)

  const [step, setStep] = useState<NewFlowStep>('choice')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')
  const [currency, setCurrency] = useState('pkr')
  const [currencyRates, setCurrencyRates] = useState<Record<string, string>>({})
  const [selectedCategory, setSelectedCategory] = useState(MOCK_CATEGORIES[0].id)
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [currencyMismatch, setCurrencyMismatch] = useState<CurrencyMismatch | null>(null)

  const deviceSync = useDeviceContactsSync()
  // Two independent, independently-paginated queries (backend's own
  // on_lain_dain filter) — not one mixed feed split client-side. See
  // useContactsQuery's docstring for why that matters for infinite scroll
  // specifically: a single shared feed can make an on-app contact "appear"
  // out of nowhere after scrolling past its alphabetical position.
  const onAppQuery = useContactsQuery(true, searchQuery)
  const inviteQuery = useContactsQuery(false, searchQuery)
  const createFriendship = useCreateFriendshipMutation()
  const createGroupMutation = useCreateGroupMutation()

  // ── Derived ──────────────────────────────────────────────────────────────────

  const filteredContacts = useMemo(
    () => onAppQuery.contacts.map(mapSyncedContact),
    [onAppQuery.contacts],
  )
  const inviteContacts = useMemo(() => {
    const serverContacts = inviteQuery.contacts.map(mapSyncedContact)
    const knownNumbers = new Set(
      [...onAppQuery.contacts, ...inviteQuery.contacts].map((contact) => contact.phone_number),
    )
    const localContacts: Contact[] = deviceSync.deviceContacts
      .filter((contact) => contact.phoneNumber !== ownPhone && !knownNumbers.has(contact.phoneNumber))
      .filter((contact) => {
        const search = searchQuery.trim().toLowerCase()
        return !search
          || contact.displayName.toLowerCase().includes(search)
          || contact.phoneNumber.includes(search)
      })
      .map((contact) => ({
        id: `device:${contact.phoneNumber}`,
        name: contact.displayName,
        phone: contact.phoneNumber,
        initials: initialsForName(contact.displayName),
        avatarColor: colorForName(contact.displayName),
        ledgerCount: 0,
        netAmount: 0,
        tags: [],
        isOnLainDain: false,
        type: 'person',
      }))

    return [...serverContacts, ...localContacts]
  }, [deviceSync.deviceContacts, inviteQuery.contacts, onAppQuery.contacts, ownPhone, searchQuery])

  const selectedList = filteredContacts.filter((c) => selectedContacts.includes(c.id))

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
    if (selectedContacts.length === 0) return
    setSubmitError(null)

    if (step === 'choice') {
      // Single-contact selection starts the direct 1:1 ledger right away
      // (idempotent — safe even if it already existed) so the success
      // screen's "Add First Expense" CTA has a real relationship to land on.
      createFriendship.mutate(
        { userId: selectedContacts[0] },
        {
          onSuccess: () => setStep('success'),
          onError: (err) => {
            const mismatch = parseCurrencyMismatch(err.message)
            if (mismatch) {
              setCurrencyMismatch(mismatch)
            } else {
              setSubmitError(err.message)
            }
          },
        },
      )
    } else {
      setStep('group_details')
    }
  }

  const closeCurrencyMismatch = () => setCurrencyMismatch(null)
  const setCurrencyRate = (currencyCode: string, rate: string) => {
    setCurrencyRates((current) => ({
      ...current,
      [currencyCode.toUpperCase()]: rate,
    }))
  }

  const resolveCurrencyMismatch = (currency: string, exchangeRate: string) => {
    if (selectedContacts.length === 0) return
    setSubmitError(null)
    createFriendship.mutate(
      { userId: selectedContacts[0], currency, exchangeRate },
      {
        onSuccess: () => {
          setCurrencyMismatch(null)
          setStep('success')
        },
        onError: (err) => setSubmitError(err.message),
      },
    )
  }

  const createGroup = () => {
    if (!groupName.trim()) return
    setSubmitError(null)
    const groupCurrency = currency.toUpperCase()
    const requiredCurrencies = [
      ...new Set(
        selectedList
          .map((contact) => contact.defaultCurrency?.toUpperCase())
          .filter((code): code is string => !!code && code !== groupCurrency),
      ),
    ]
    const missingRate = requiredCurrencies.find(
      (code) => Number(currencyRates[code] ?? 0) <= 0,
    )
    if (missingRate) {
      setSubmitError(`Enter the ${missingRate} exchange rate before creating this group.`)
      return
    }

    createGroupMutation.mutate(
      {
        name: groupName.trim(),
        description: description.trim(),
        defaultCurrency: groupCurrency,
        category: selectedCategory,
        memberIds: selectedContacts,
        image: groupAvatar,
        currencyRates: Object.fromEntries(
          requiredCurrencies.map((code) => [code, currencyRates[code]]),
        ),
      },
      {
        onSuccess: () => setStep('success'),
        onError: (err) => setSubmitError(err.message),
      },
    )
  }

  return {
    step,
    setStep,
    goBack,
    syncStatus: deviceSync.status,
    isSyncing: deviceSync.isSyncing,
    syncError: deviceSync.syncError,
    requestContactsAccess: deviceSync.requestAccess,
    selectedContacts,
    selectedList,
    filteredContacts,
    onAppContactsPage: {
      hasMore: onAppQuery.hasNextPage,
      isFetchingMore: onAppQuery.isFetchingNextPage,
      fetchMore: onAppQuery.fetchNextPage,
    },
    inviteContacts,
    inviteContactsPage: {
      hasMore: inviteQuery.hasNextPage,
      isFetchingMore: inviteQuery.isFetchingNextPage,
      fetchMore: inviteQuery.fetchNextPage,
    },
    isLoadingContacts: onAppQuery.isLoading || inviteQuery.isLoading,
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
    currencyRates,
    setCurrencyRate,
    selectedCategory,
    setSelectedCategory,
    groupAvatar,
    setGroupAvatar,
    nextStep,
    createGroup,
    isSubmitting: createFriendship.isPending || createGroupMutation.isPending,
    submitError,
    currencyMismatch,
    closeCurrencyMismatch,
    resolveCurrencyMismatch,
  }
}
