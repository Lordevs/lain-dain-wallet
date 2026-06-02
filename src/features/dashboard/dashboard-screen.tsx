import { useState } from 'react'
import { Info } from 'lucide-react'
import AppHeader from '@/components/layout/app-header'
import SearchBar from '@/components/shared/search-bar'
import BalanceSummaryCard from './components/balance-summary-card'
import LedgerTabs, { type LedgerTab } from './components/ledger-tabs'
import SectionHeader from './components/section-header'
import ContactLedgerCard from './components/contact-ledger-card'
import Fab from './components/fab'
import { MOCK_BALANCE, MOCK_RECEIVABLES, MOCK_PAYABLES } from './data/mock-data'
import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * DashboardScreen — the main home screen of the Lain Dain Wallet app.
 * Assembles all reusable dashboard components into the final layout.
 */
export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<LedgerTab>('receivables')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'people' | 'groups'>('all')

  const contacts = activeTab === 'receivables' ? MOCK_RECEIVABLES : MOCK_PAYABLES

  // Filter based on selected content type (person/group)
  const typedContacts = contacts.filter((c) => {
    if (filter === 'people') return c.type === 'person'
    if (filter === 'groups') return c.type === 'group'
    return true
  })

  const filteredContacts = search.trim()
    ? typedContacts.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    )
    : typedContacts

  // Title changes based on the selected tab and active filter type
  const sectionTitle =
    activeTab === 'receivables'
      ? filter === 'groups'
        ? 'Groups who owe you'
        : 'People who owe you'
      : filter === 'groups'
        ? 'Groups you owe'
        : 'People you owe'

  // Wording for the alerts when elements are filtered out
  const searchFilteredAll = search.trim()
    ? contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : contacts

  const hasHiddenGroups = filter === 'people' && searchFilteredAll.some((c) => c.type === 'group')
  const hasHiddenPeople = filter === 'groups' && searchFilteredAll.some((c) => c.type === 'person')

  const hiddenPeopleNames = searchFilteredAll
    .filter((c) => c.type === 'person')
    .map((p) => p.name.split(' ')[0])

  let seeText = ''
  if (hiddenPeopleNames.length === 1) {
    seeText = hiddenPeopleNames[0]
  } else if (hiddenPeopleNames.length > 1) {
    seeText =
      hiddenPeopleNames.slice(0, -1).join(', ') +
      ' and ' +
      hiddenPeopleNames[hiddenPeopleNames.length - 1]
  }

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1]">
      {/* App Header — Logo + Avatar */}
      <AppHeader />

      {/* Search Bar */}
      <div className="px-6 mt-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          id="dashboard-search"
        />
      </div>

      {/* Balance Summary Card */}
      <BalanceSummaryCard summary={MOCK_BALANCE} />

      {/* Tab Switcher */}
      <LedgerTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Section Label + Filter */}
      <SectionHeader
        title={sectionTitle}
        currentFilter={filter}
        onFilterChange={setFilter}
      />

      {/* Contact/Group Ledger Cards */}
      <div className="flex flex-col gap-3 px-6 pb-6">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <ContactLedgerCard
              key={contact.id}
              contact={contact}
              onClick={() => console.log('open ledger', contact.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground text-sm">No results found</p>
          </div>
        )}

        {/* Filter warning alerts */}
        {hasHiddenGroups && (
          <Alert className="bg-white! border-[1.08px] border-[#EFE7DD] text-[#9A9590] rounded-xl flex items-center gap-3 py-3 px-4">
            <Info size={16} className="text-[#9C9893] shrink-0" />
            <AlertDescription className="text-[#9A9590] text-[13px] font-medium leading-none p-0 m-0">
              Groups are hidden. Switch to All to see them.
            </AlertDescription>
          </Alert>
        )}
        {hasHiddenPeople && (
          <Alert className="bg-white! border-[1.08px] border-[#EFE7DD] text-[#9A9590] rounded-xl flex items-center gap-3 py-3 px-4">
            <Info size={16} className="text-[#9C9893] shrink-0" />
            <AlertDescription className="text-[#9A9590] text-[13px] font-medium leading-none p-0 m-0">
              People filtered out. Switch to All to see {seeText}.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Floating Action Button */}
      <Fab onClick={() => console.log('add new')} />
    </div>
  )
}
