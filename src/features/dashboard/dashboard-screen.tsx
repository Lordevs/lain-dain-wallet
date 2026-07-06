import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ROUTES } from '@/constants/routes'
import AppHeader from '@/components/layout/app-header'
import SearchBar from '@/components/shared/search-bar'
import BalanceSummaryCard from './components/balance-summary-card'
import LedgerTabs, { type LedgerTab } from './components/ledger-tabs'
import SectionHeader from './components/section-header'
import ContactLedgerCard from './components/contact-ledger-card'
import SearchResultsOverlay from './components/search-results-overlay'
import Fab from './components/fab'
import { useShallow } from 'zustand/react/shallow'
import { useContactStore, selectBalanceSummary, selectReceivables, selectPayables } from '@/store/use-contact-store'


/**
 * DashboardScreen — the main home screen of the Lain Dain Wallet app.
 * Assembles all reusable dashboard components into the final layout.
 */
export default function DashboardScreen() {
  const navigate = useNavigate({ from: '/' })
  const [activeTab, setActiveTab] = useState<LedgerTab>('receivables')
  const [search, setSearch] = useState('')
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'people' | 'groups'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')

  const balanceSummary = useContactStore(useShallow(selectBalanceSummary))
  const receivables = useContactStore(useShallow(selectReceivables))
  const payables = useContactStore(useShallow(selectPayables))

  // All contacts (receivables + payables) for search
  const allContacts = useContactStore(useShallow((s) => s.contacts))

  const handleSearchFocus = () => {
    setIsSearchActive(true)
  }

  const handleSearchClose = () => {
    setSearch('')
    setIsSearchActive(false)
  }

  const contacts = activeTab === 'receivables' ? receivables : payables

  // Filter based on selected content type (person/group)
  const typedContacts = contacts.filter((c) => {
    if (filterType === 'people') return c.type === 'person'
    if (filterType === 'groups') return c.type === 'group'
    return true
  })

  // Sort contacts based on selected sort order
  const sortedContacts = [...typedContacts].sort((a, b) => {
    if (sortBy === 'newest') {
      const idA = isNaN(Number(a.id)) ? a.id : Number(a.id)
      const idB = isNaN(Number(b.id)) ? b.id : Number(b.id)
      if (typeof idA === 'number' && typeof idB === 'number') return idB - idA
      return String(idB).localeCompare(String(idA))
    }
    if (sortBy === 'oldest') {
      const idA = isNaN(Number(a.id)) ? a.id : Number(a.id)
      const idB = isNaN(Number(b.id)) ? b.id : Number(b.id)
      if (typeof idA === 'number' && typeof idB === 'number') return idA - idB
      return String(idA).localeCompare(String(idB))
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
            {filteredContacts.length > 0 ? (
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
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-muted-foreground text-sm">No results found</p>
              </div>
            )}
          </div>

          {/* Floating Action Button */}
          <Fab onClick={() => navigate({ to: ROUTES.NEW_CONTACT })} />
        </>
      )}
    </div>
  )
}
