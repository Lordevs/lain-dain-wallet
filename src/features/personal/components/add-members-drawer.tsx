import { Check } from 'lucide-react'
import FlowHeader from '@/components/shared/flow-header'
import SearchBar from '@/components/shared/search-bar'
import ContactList from '@/components/shared/contact-list'
import ContactListItem from '@/components/shared/contact-list-item'
import { cn } from '@/lib/utils'

interface AddMembersDrawerProps {
  isOpen: boolean
  onClose: () => void
  peopleSearch: string
  setPeopleSearch: (v: string) => void
  peopleList: any[]
  selectedIds: string[]
  onToggle: (id: string) => void
}

export default function AddMembersDrawer({
  isOpen,
  onClose,
  peopleSearch,
  setPeopleSearch,
  peopleList,
  selectedIds,
  onToggle,
}: AddMembersDrawerProps) {
  if (!isOpen) return null

  return (
    <div className="app-fullscreen z-50 flex min-h-0 flex-col overflow-hidden bg-[#FEFAF1]">
      <FlowHeader
        title="Add members"
        onBack={onClose}
        backVariant="circle"
        rightSlot={
          <button
            onClick={onClose}
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
                  onClick={() => onToggle(contact.id)}
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
  )
}
