import { useState } from 'react'
import { Info, Check } from 'lucide-react'
import { useContactStore } from '@/store/use-contact-store'
import FlowHeader from '@/components/shared/flow-header'
import SearchBar from '@/components/shared/search-bar'
import { cn } from '@/lib/utils'
import ContactAvatar from '@/components/shared/contact-avatar'
import ContactList from '@/components/shared/contact-list'
import ContactListItem from '@/components/shared/contact-list-item'
import { useDrawerBackHandler } from '@/hooks/use-drawer-back-handler'

export default function HideLedgersScreen() {
  const { contacts, hiddenLedgerIds, setHiddenLedgerIds } = useContactStore()

  // Search state for main screen (groups) and overlay screen (people)
  const [groupSearch, setGroupSearch] = useState('')
  const [peopleSearch, setPeopleSearch] = useState('')

  // Unified selected hidden IDs
  const [selectedIds, setSelectedIds] = useState<string[]>(() => hiddenLedgerIds)
  const [showAddPeople, setShowAddPeople] = useState(false)

  // Drawer back button handler for people selection overlay
  const closePeopleSelection = useDrawerBackHandler(showAddPeople, () => setShowAddPeople(false))

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSave = () => {
    setHiddenLedgerIds(selectedIds)
    window.history.back()
  }

  // Filter lists
  const groupsList = contacts.filter((c) =>
    c.type === 'group' && c.name.toLowerCase().includes(groupSearch.toLowerCase())
  )

  const peopleList = contacts.filter((c) =>
    c.type === 'person' && c.name.toLowerCase().includes(peopleSearch.toLowerCase())
  )

  // Derive selected members (people) for the horizontal strip
  const selectedPeople = contacts.filter((c) =>
    c.type === 'person' && selectedIds.includes(c.id)
  )

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none overflow-hidden text-left relative">
      {/* Main Screen Header */}
      <FlowHeader
        title="Hide from My Expenses"
        backVariant="circle"
        rightSlot={
          <button
            onClick={handleSave}
            className="text-positive font-bold text-[15px] bg-transparent border-0 cursor-pointer outline-none hover:opacity-85"
          >
            Save
          </button>
        }
      />

      {/* Main screen body */}
      <div className="flex-1 overflow-y-auto px-6 pb-12 flex flex-col gap-6 mt-3">
        {/* Info Banner */}
        <div className="bg-[#E4F2EB] border-[1.5px] border-[#0B683A26] rounded-[14px] p-5 flex flex-col gap-2 shadow-[0px_4px_16px_rgba(0,0,0,0.01)] text-left">
          <h4 className="text-[13px] font-bold text-positive flex items-center gap-2 leading-tight">
            <Info size={18} strokeWidth={2.5} className="shrink-0" />
            Choose the groups or people you don't want to include in My Expenses.
          </h4>
          <p className="text-[13px] text-[#6B6B6B] font-normal leading-tight">
            hidden balances wont appear in your personal 'My Expenses'.
          </p>
        </div>

        {/* Search Groups Block */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-bold text-[#9A9590] tracking-[0.8px] mb-2 uppercase">
            Choose what shows
          </h4>
          <SearchBar
            id="hide-ledgers-group-search"
            value={groupSearch}
            onChange={setGroupSearch}
            placeholder="Search groups..."
          />
        </div>

        {/* Selected Strip (MEMBERS) - Displays hidden people contacts */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-bold text-[#9A9590] tracking-[0.8px] mb-3 uppercase">
            Members({selectedPeople.length})
          </h4>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {selectedPeople.map((member) => (
              <div
                key={member.id}
                className="relative flex flex-col items-center shrink-0"
              >
                <div className="relative">
                  <div className="p-0.5 rounded-full border-[2.2px] border-primary bg-background">
                    <ContactAvatar
                      initials={member.initials}
                      avatarColor={member.avatarColor}
                      size="md"
                    />
                  </div>
                  {/* Remove red badge overlay */}
                  <button
                    type="button"
                    onClick={() => handleToggle(member.id)}
                    className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#E53E3E] text-white border-[1.5px] border-white flex items-center justify-center font-bold text-[10px] cursor-pointer hover:bg-[#E53E3E]/90 shadow-sm"
                  >
                    ×
                  </button>
                </div>
                <span className="text-[11px] font-medium text-foreground mt-1 max-w-[56px] truncate text-center">
                  {member.name.split(' ')[0]}
                </span>
              </div>
            ))}

            {/* Custom "Add" button slot - opens People selector */}
            <div className="relative flex flex-col items-center shrink-0">
              <button
                type="button"
                onClick={() => setShowAddPeople(true)}
                className="p-0.5 rounded-full border-[2.2px] border-dashed border-[#C7C3B7] bg-transparent cursor-pointer hover:bg-[#C7C3B7]/10"
              >
                <div className="w-10 h-10 rounded-full bg-[#F3EFE7] flex items-center justify-center text-muted-foreground relative">
                  <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#0B683A] text-white border-[1.5px] border-white flex items-center justify-center font-bold text-xs">
                    +
                  </span>
                </div>
              </button>
              <span className="text-[11px] font-medium text-[#6B6B6B] mt-1 text-center">
                Add
              </span>
            </div>
          </div>
        </div>

        {/* Groups list */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-bold text-[#9A9590] tracking-[0.8px] mb-3 uppercase">
            Groups
          </h4>
          <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EBEBEB] overflow-hidden">
            {groupsList.map((item) => {
              const isSelected = selectedIds.includes(item.id)
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggle(item.id)}
                  className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer bg-white"
                >
                  <div className="flex items-center gap-3">
                    <ContactAvatar
                      initials={item.initials}
                      avatarColor={item.avatarColor}
                      size="md"
                    />
                    <div className="flex flex-col text-left">
                      <span className="font-extrabold text-[15px] text-[#1A1A1A] leading-tight truncate max-w-[180px]">
                        {item.name}
                      </span>
                      <span className="text-[12px] font-semibold text-[#6B6B6B] mt-0.5">
                        {item.ledgerCount} members
                      </span>
                    </div>
                  </div>

                  {/* Rounded Checkbox */}
                  <div className={cn(
                    "w-6 h-6 rounded-full border flex items-center justify-center transition-all shrink-0",
                    isSelected ? "border-positive bg-positive text-white" : "border-[#D1D1D6] bg-white"
                  )}>
                    {isSelected && (
                      <Check size={13} className="text-white stroke-[3.5px]" />
                    )}
                  </div>
                </div>
              )
            })}

            {groupsList.length === 0 && (
              <div className="p-8 text-center text-[#6B6B6B] text-sm">
                No groups found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add People Fullscreen Overlay (Drawer Selector) */}
      {showAddPeople && (
        <div className="fixed inset-0 z-50 bg-[#FEFAF1] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          <FlowHeader
            title="Add members"
            onBack={closePeopleSelection}
            backVariant="circle"
            rightSlot={
              <button
                onClick={closePeopleSelection}
                className="text-positive font-bold text-[15px] bg-transparent border-0 cursor-pointer outline-none hover:opacity-85"
              >
                Done
              </button>
            }
          />

          <div className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col gap-4 mt-3">
            {/* Search People */}
            <SearchBar
              id="hide-ledgers-people-search"
              value={peopleSearch}
              onChange={setPeopleSearch}
              placeholder="Search by name or number"
            />

            {/* People Contacts List */}
            <div className="mt-2 text-left">
              <ContactList title="Contacts on Lain Dain" titleColor="primary">
                {peopleList.map((contact) => {
                  const isChecked = selectedIds.includes(contact.id)
                  return (
                    <ContactListItem
                      key={contact.id}
                      contact={contact}
                      subtitle={<span className="text-primary font-bold">On Lain Dain</span>}
                      onClick={() => handleToggle(contact.id)}
                      isHighlighted={isChecked}
                      rightSlot={
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full border-[1.5px] transition-all flex items-center justify-center',
                            isChecked
                              ? 'bg-primary border-primary text-white'
                              : 'border-muted-foreground/30 bg-transparent',
                          )}
                        >
                          {isChecked && <Check size={14} strokeWidth={3} />}
                        </div>
                      }
                    />
                  )
                })}
              </ContactList>

              {peopleList.length === 0 && (
                <div className="p-8 text-center text-[#6B6B6B] text-sm">
                  No contacts found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
