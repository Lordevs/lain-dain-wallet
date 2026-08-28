import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { ROUTES } from '@/constants/routes'
import type { Contact } from '@/types'
import AppHeader from '@/components/layout/app-header'
import SearchBar from '@/components/shared/search-bar'
import BalanceSummaryCard from './components/balance-summary-card'
import LedgerTabs, { type LedgerTab } from './components/ledger-tabs'
import SectionHeader from './components/section-header'
import ContactLedgerCard from './components/contact-ledger-card'
import SearchResultsOverlay from './components/search-results-overlay'
import Fab from './components/fab'
import EmptyState from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useWalletListQuery } from './api/use-wallet-list-query'
import { useWalletSummaryQuery } from './api/use-wallet-summary-query'
import { mapWalletRow } from './lib/map-wallet-row'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { WifiOff } from 'lucide-react'


/**
 * DashboardScreen — the main home screen of the Lain Dain Wallet app.
 * Assembles all reusable dashboard components into the final layout.
 */
export default function DashboardScreen() {
  const navigate = useNavigate({ from: '/' })
  const searchParams = useSearch({ from: '/' })
  const isSearchActive = searchParams.search === 'active'

  const [activeTab, setActiveTab] = useState<LedgerTab>('receivables')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'people' | 'groups'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')

  const isOnline = useNetworkStatus()
  const summaryQuery = useWalletSummaryQuery()
  // Both tabs are fetched unconditionally (not just the active one) so
  // switching tabs is instant — the list is small/bounded either way (see
  // useWalletListQuery's docstring), so this is two lightweight calls,
  // not real over-fetching. (Search has its own real backend queries —
  // see SearchResultsOverlay — this pair is unrelated to it.)
  const receivablesQuery = useWalletListQuery('receivables')
  const payablesQuery = useWalletListQuery('payables')

  const balanceSummary = useMemo(() => {
    const s = summaryQuery.data
    return {
      totalReceivable: s ? Number(s.receivable) : 0,
      totalPayable: s ? Number(s.payable) : 0,
      netBalance: s ? Number(s.net) : 0,
      currency: s?.currency ?? 'PKR',
    }
  }, [summaryQuery.data])

  const receivables = useMemo(() => (receivablesQuery.data ?? []).map(mapWalletRow), [receivablesQuery.data])
  const payables = useMemo(() => (payablesQuery.data ?? []).map(mapWalletRow), [payablesQuery.data])
  const allContacts = useMemo(() => {
    const map = new Map<string, typeof receivables[number]>()
    ;[...receivables, ...payables].forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item)
      }
    })
    return Array.from(map.values())
  }, [receivables, payables])
  const isLoading = receivablesQuery.isLoading || payablesQuery.isLoading
  const isWalletEmpty = !isLoading && allContacts.length === 0
  // Offline with nothing cached: neither wallet query has any data at all
  // (not "0 results", genuinely undefined) — distinguished from a real
  // empty account so we don't tell a returning user with real ledgers
  // "let's get started" just because they're offline right now.
  const offlineNoWalletData = !isOnline && receivablesQuery.data === undefined && payablesQuery.data === undefined
  const offlineNoSummaryData = !isOnline && summaryQuery.data === undefined

  const handleSearchFocus = () => {
    navigate({
      search: { search: 'active' },
    })
  }

  const handleSearchClose = () => {
    setSearch('')
    navigate({
      search: {},
    })
  }

  const contacts = activeTab === 'receivables' ? receivables : payables

  // Filter -> sort -> filter chain re-runs only when one of its actual
  // inputs changes, instead of on every render (e.g. every keystroke
  // into the search box before search.trim() even blocks it, or any
  // unrelated parent re-render).
  const filteredContacts = useMemo(() => {
    // Filter based on selected content type (person/group)
    const typedContacts = contacts.filter((c) => {
      if (filterType === 'people') return c.type === 'person'
      if (filterType === 'groups') return c.type === 'group'
      return true
    })

    // Sort contacts based on selected sort order — latestActivity (a real
    // timestamp from the backend) drives newest/oldest now; falls back to
    // the id-based comparison only for any contact missing it.
    const sortedContacts = [...typedContacts].sort((a, b) => {
      const directionRank = (amount: number) => {
        if (activeTab === 'receivables') return amount > 0 ? 0 : amount === 0 ? 1 : 2
        return amount < 0 ? 0 : amount === 0 ? 1 : 2
      }
      const rankDifference = directionRank(a.netAmount) - directionRank(b.netAmount)
      if (rankDifference !== 0) return rankDifference

      if (sortBy === 'newest' || sortBy === 'oldest') {
        if (a.latestActivity && b.latestActivity) {
          const diff = new Date(a.latestActivity).getTime() - new Date(b.latestActivity).getTime()
          return sortBy === 'newest' ? -diff : diff
        }
        const idA = isNaN(Number(a.id)) ? a.id : Number(a.id)
        const idB = isNaN(Number(b.id)) ? b.id : Number(b.id)
        const cmp =
          typeof idA === 'number' && typeof idB === 'number' ? idA - idB : String(idA).localeCompare(String(idB))
        return sortBy === 'newest' ? -cmp : cmp
      }
      if (sortBy === 'highest') return Math.abs(b.netAmount) - Math.abs(a.netAmount)
      if (sortBy === 'lowest') return Math.abs(a.netAmount) - Math.abs(b.netAmount)
      return 0
    })

    return search.trim()
      ? sortedContacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      : sortedContacts
  }, [contacts, activeTab, filterType, sortBy, search])

  const handleContactSelect = useCallback((contact: Contact) => {
    if (contact.type === 'person') {
      navigate({ to: ROUTES.CONTACT_BREAKDOWN, params: { id: contact.id } })
    } else {
      navigate({ to: ROUTES.GROUP_DETAILS, params: { id: contact.id } })
    }
  }, [navigate])

  // Title changes based on the active filter type and sort order
  const sectionTitle = (() => {
    if (filterType === 'people') return 'People'
    if (filterType === 'groups') return 'Groups'
    // 'all' filter type case
    if (sortBy === 'newest') return 'All'
    if (sortBy === 'oldest') return 'Oldest First'
    if (sortBy === 'highest') return 'Highest Amount'
    return 'Lowest Amount'
  })()



  return (
    <div className={isSearchActive
      ? 'flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#FEFAF1]'
      : 'flex h-full min-h-0 flex-1 touch-pan-y flex-col overflow-y-auto overscroll-y-contain bg-[#FEFAF1]'
    }>
      {/* App Header — Logo + Avatar (hidden when search is active) */}
      {!isSearchActive && <AppHeader />}

      {/* Search Bar area */}
      {isSearchActive ? (
        /* Active Search Header using SearchBar in isActive mode */
        <div className="px-4 py-3 shrink-0">
          <SearchBar
            id="dashboard-search-active"
            value={search}
            onChange={setSearch}
            onBack={handleSearchClose}
            onClear={() => setSearch('')}
            placeholder="Search people or groups…"
            isActive
          />
        </div>
      ) : (
        /* Passive Search Bar (tap to activate) */
        <div className="mt-3 shrink-0 px-6">
          <SearchBar
            value=""
            onChange={() => {}}
            onFocus={handleSearchFocus}
            id="dashboard-search"
          />
        </div>
      )}

      {/* Search Results — rendered as flex-1 sibling below the search bar */}
      {isSearchActive ? (
        <SearchResultsOverlay
          query={search}
          onPersonClick={(id) => {
            handleSearchClose()
            navigate({
              to: ROUTES.CONTACT_BREAKDOWN,
              params: { id },
            })
          }}
          onClose={handleSearchClose}
        />
      ) : (
        /* Main Content */
        <div className="flex flex-col">
          {/* Balance Summary Card */}
          {summaryQuery.isLoading ? (
            <div className="mx-6 mt-3 flex shrink-0 divide-x divide-border-card rounded-lg border-[1.08px] border-border-card bg-white shadow-[0px_2.69px_10.76px_0px_#0000000D]">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-1 py-3 px-2 flex flex-col items-center gap-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="size-10 rounded-full" />
                </div>
              ))}
            </div>
          ) : offlineNoSummaryData ? (
            <div className="mx-6 mt-3 flex shrink-0 items-center gap-3 rounded-lg border-[1.08px] border-border-card bg-white p-4 shadow-[0px_2.69px_10.76px_0px_#0000000D]">
              <WifiOff size={18} className="shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                You're offline — balances aren't available until you're back online.
              </p>
            </div>
          ) : (
            <BalanceSummaryCard summary={balanceSummary} />
          )}

          {/* Tab Switcher */}
          <LedgerTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Section Label + Filter */}
          <SectionHeader
            title={sectionTitle}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
          />

          {/* Contact/Group Ledger Cards */}
          <div className={isWalletEmpty
            ? 'flex min-h-72 items-center justify-center px-6 pb-24'
            : 'flex flex-col gap-1.5 px-6 pb-24'
          }>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex shrink-0 items-center gap-3 rounded-lg border-[1.08px] border-border-card bg-white px-4 pb-3 pt-4"
                >
                  <Skeleton className="size-12 rounded-full shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <ContactLedgerCard
                  key={contact.id}
                  contact={contact}
                  onSelect={handleContactSelect}
                />
              ))
            ) : offlineNoWalletData ? (
              <EmptyState
                title="You're offline"
                description="Your ledgers aren't cached yet — connect once to load them, then they'll be available offline too."
                className="w-full max-w-md py-4"
              />
            ) : allContacts.length === 0 ? (
              <EmptyState
                title="Welcome! Let’s get started with your Lain Dain"
                description="Add your first expense to begin."
                actionLabel="Add First Expense"
                onAction={() => navigate({ to: ROUTES.NEW_CONTACT })}
                className="w-full max-w-md py-4"
              />
            ) : (
              <EmptyState
                title="No records found"
                description="Try adjusting your active filters or sorting criteria."
              />
            )}
          </div>

          {/* Floating Action Button */}
          {!isWalletEmpty && <Fab onClick={() => navigate({ to: ROUTES.NEW_CONTACT })} />}
        </div>
      )}
    </div>
  )
}
