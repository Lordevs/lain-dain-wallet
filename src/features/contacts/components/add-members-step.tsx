import { ChevronLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import SearchBar from '@/components/shared/search-bar'
import ContactList from '@/components/shared/contact-list'
import ContactListItem from '@/components/shared/contact-list-item'
import SelectedMembersStrip from '@/components/shared/selected-members-strip'
import InfiniteScrollSentinel from '@/components/shared/infinite-scroll-sentinel'
import ContactListSkeleton from '@/components/shared/contact-list-skeleton'
import type { NewContactFlowState } from '../hooks/use-new-contact-flow'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddMembersStepProps {
  flow: NewContactFlowState
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * AddMembersStep (Step 2) — lets the user search and select group members.
 * Selected contacts appear in a horizontally scrollable strip at the top.
 * A sticky "Next" button is enabled once at least one member is selected.
 */
export default function AddMembersStep({ flow }: AddMembersStepProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6">
      {/* Search */}
      <SearchBar
        id="add-members-search"
        value={flow.searchQuery}
        onChange={flow.setSearchQuery}
        placeholder="Search members"
        className="my-3 shrink-0"
      />

      {/* Selected members strip */}
      <SelectedMembersStrip
        members={flow.selectedList}
        onRemove={flow.removeContact}
        className="shrink-0 mb-1"
      />

      {/* Contacts list */}
      <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain pb-4">
        {flow.isLoadingContacts && <ContactListSkeleton />}
        <ContactList title="Contacts on Lain Dain" titleColor="primary">
          {flow.filteredContacts.map((contact) => {
            const isChecked = flow.selectedContacts.includes(contact.id)
            return (
              <ContactListItem
                key={contact.id}
                contact={contact}
                subtitle={<span className="text-primary font-bold">On Lain Dain</span>}
                onClick={() => flow.toggleContact(contact.id)}
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

        <InfiniteScrollSentinel
          onLoadMore={flow.onAppContactsPage.fetchMore}
          hasMore={flow.onAppContactsPage.hasMore}
          isLoading={flow.onAppContactsPage.isFetchingMore}
        />
      </div>

      {/* In-layout Next footer — visible above the real device inset. */}
      {flow.selectedContacts.length > 0 && (
        <div className="z-10 shrink-0 bg-background pb-5 pt-3">
          <Button
            onClick={flow.nextStep}
            className="h-14 w-full cursor-pointer rounded-full bg-primary text-[15px] font-extrabold text-white shadow-lg transition-transform active:scale-[0.98]"
          >
            Next
            <ChevronLeft size={16} className="rotate-180 ml-1 shrink-0" strokeWidth={3} />
          </Button>
        </div>
      )}
    </div>
  )
}
