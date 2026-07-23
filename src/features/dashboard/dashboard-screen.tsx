import { useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { ROUTES } from '@/constants/routes'
import AppHeader from '@/components/layout/app-header'
import SearchBar from '@/components/shared/search-bar'
import BalanceSummaryCard from './components/balance-summary-card'
import LedgerTabs, { type LedgerTab } from './components/ledger-tabs'
import SectionHeader from './components/section-header'
import ContactLedgerCard from './components/contact-ledger-card'
import SearchResultsOverlay from './components/search-results-overlay'
import Fab from './components/fab'
import EmptyState from '@/components/shared/empty-state'
import { useWalletListQuery } from './api/use-wallet-list-query'
import { useWalletSummaryQuery } from './api/use-wallet-summary-query'
import { mapWalletRow } from './lib/map-wallet-row'


/**
 * DashboardScreen — the main home screen of the Lain Dain Wallet app.
 * Assembles all reusable dashboard components into the final layout.
 */
export default function DashboardScreen() {
  const navigate = useNavigate({ from: '/' })
  const searchParams = useSearch({ from: '/' }) as any
  const isSearchActive = searchParams.search === 'active'

  const [activeTab, setActiveTab] = useState<LedgerTab>('receivables')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'people' | 'groups'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')

  const summaryQuery = useWalletSummaryQuery()
  // Both tabs are fetched unconditionally (not just the active one) so
  // search can look across receivables + payables at once, same as the
  // old mock's combined `allContacts` — the list is small/bounded either
  // way (see useWalletListQuery's docstring), so this is two lightweight
  // calls, not real over-fetching.
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
  const allContacts = useMemo(() => [...receivables, ...payables], [receivables, payables])
  const isLoading = receivablesQuery.isLoading || payablesQuery.isLoading

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

  const filteredContacts = search.trim()
    ? sortedContacts.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    )
    : sortedContacts

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
    <div className="flex flex-col flex-1 bg-[#FEFAF1] overflow-hidden">
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
        <div className="px-6 mt-3">
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
          contacts={allContacts}
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
        <>
          {/* Balance Summary Card */}
          <BalanceSummaryCard summary={balanceSummary} />

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
          <div className="flex flex-col gap-1.5 px-6 pb-6">
            {isLoading ? (
              <p className="text-muted-foreground text-sm text-center py-8">Loading...</p>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <ContactLedgerCard
                  key={contact.id}
                  contact={contact}
                  onClick={() => {
                    if (contact.type === 'person') {
                      navigate({
                        to: ROUTES.CONTACT_BREAKDOWN,
                        params: { id: contact.id },
                      })
                    } else {
                      navigate({
                        to: ROUTES.GROUP_DETAILS,
                        params: { id: contact.id },
                      })
                    }
                  }}
                />
              ))
            ) : allContacts.length === 0 ? (
              <EmptyState
                title="Welcome! Let’s get started with your Lain Dain"
                description="Add your first expense to begin."
                actionLabel="Add First Expense"
                onAction={() => navigate({ to: ROUTES.NEW_CONTACT })}
              />
            ) : (
              <EmptyState
                title="No records found"
                description="Try adjusting your active filters or sorting criteria."
              />
            )}
          </div>

          {/* Floating Action Button */}
          <Fab onClick={() => navigate({ to: ROUTES.NEW_CONTACT })} />
        </>
      )}
    </div>
  )
}
