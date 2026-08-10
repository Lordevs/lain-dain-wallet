import { Check, Users, Shield, ChevronLeft, Contact as ContactIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import SearchBar from '@/components/shared/search-bar'
import QuickActionButton from '@/features/contacts/components/quick-action-button'
import ContactList from '@/components/shared/contact-list'
import ContactListItem from '@/components/shared/contact-list-item'
import FormError from '@/components/shared/form-error'
import InfiniteScrollSentinel from '@/components/shared/infinite-scroll-sentinel'
import ContactListSkeleton from '@/components/shared/contact-list-skeleton'
import CurrencyMismatchDrawer from '@/features/contacts/components/currency-mismatch-drawer'
import { shareInvite } from '@/lib/share-invite'
import type { NewContactFlowState } from '../hooks/use-new-contact-flow'
import { Button } from '@/components/ui/button'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChoiceStepProps {
  flow: NewContactFlowState
}

// ─── Sub-component: Checkbox indicator ───────────────────────────────────────

function SelectionCheckbox({ checked }: { checked: boolean }) {
  return (
    <div
      className={cn(
        'w-6 h-6 rounded-full transition-all flex items-center justify-center border-[2.25px]',
        checked
          ? 'bg-primary border-primary text-white'
          : 'border-divider bg-transparent',
      )}
    >
      {checked && <Check size={14} strokeWidth={3} />}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ChoiceStep (Step 1) — entry screen for the new contact / group flow.
 * Shows: search bar, quick-action buttons, contacts list, invite list, footer.
 */
export default function ChoiceStep({ flow }: ChoiceStepProps) {
  const hasSelection = flow.selectedContacts.length > 0

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-24 relative scrollbar-none">
      {/* Search */}
      <SearchBar
        id="choice-search"
        value={flow.searchQuery}
        onChange={flow.setSearchQuery}
        placeholder="Search by name or number"
        className="my-3 shrink-0"
      />

      {/* Quick Actions — New Group */}
      <div className="bg-white border-[1.26px] border-border-card rounded-xl shadow-[0px_2px_8px_0px_#00000005] mb-5 overflow-hidden shrink-0">
        {/* New Group */}
        <QuickActionButton
          title="New Group"
          description="Split expenses with multiple people"
          icon={<Users strokeWidth={2} className='size-5.5' />}
          onClick={() => flow.setStep('add_members')}
        />
      </div>

      {/* Contacts permission prompt */}
      {flow.syncStatus === 'prompt' && (
        <div className="bg-white border-[1.26px] border-border-card rounded-xl shadow-[0px_2px_8px_0px_#00000005] mb-5 p-4 flex items-center gap-3 shrink-0">
          <div className="w-11 h-11 rounded-full bg-[#E4F2EB] flex items-center justify-center text-primary shrink-0">
            <ContactIcon size={20} strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">See who's on Lain Dain</p>
            <p className="text-xs text-muted-foreground mt-0.5">Allow contacts access to match your phone contacts against the app.</p>
          </div>
          <Button onClick={flow.requestContactsAccess} className="h-9 rounded-full px-4 text-xs font-bold shrink-0">
            Allow
          </Button>
        </div>
      )}
      {flow.syncStatus === 'denied' && (
        <p className="text-xs text-muted-foreground mb-5 px-1 shrink-0">
          Contacts access is off — enable it in your device settings to see who's already on Lain Dain.
        </p>
      )}
      <FormError message={flow.syncError ?? flow.submitError} className="mb-4" />

      {/* Scrollable contact lists */}
      <div className="space-y-6">
        {flow.isLoadingContacts && <ContactListSkeleton />}
        {!flow.isLoadingContacts && flow.filteredContacts.length === 0 && flow.inviteContacts.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            {flow.searchQuery ? 'No contacts match your search.' : 'No synced contacts yet.'}
          </p>
        )}

        {/* Contacts on Lain Dain */}
        {flow.filteredContacts.length > 0 && (
          <div>
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
                    rightSlot={<SelectionCheckbox checked={isChecked} />}
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
        )}

        {/* Invite to Lain Dain */}
        {flow.inviteContacts.length > 0 && (
          <div>
            <ContactList title="Invite to Lain Dain" titleColor="muted">
              {flow.inviteContacts.map((contact) => (
                <ContactListItem
                  key={contact.id}
                  contact={contact}
                  contactNameClassName='text-muted-foreground/70 font-medium'
                  subtitle={<span className="text-muted-foreground">{contact.phone}</span>}
                  rightSlot={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => shareInvite(contact.name)}
                      className="h-8 rounded-[10px] border-[1.26px] border-divider text-xs font-bold px-4 bg-transparent! text-muted-foreground"
                    >
                      Invite
                    </Button>
                  }
                />
              ))}
            </ContactList>
            <InfiniteScrollSentinel
              onLoadMore={flow.inviteContactsPage.fetchMore}
              hasMore={flow.inviteContactsPage.hasMore}
              isLoading={flow.inviteContactsPage.isFetchingMore}
            />
          </div>
        )}
      </div>

      {/* Sticky Next button */}
      {hasSelection && (
        <div className="fixed bottom-3 left-3 right-3 z-10">
          <Button
            onClick={flow.nextStep}
            disabled={flow.isSubmitting}
            className="w-full h-14 rounded-full bg-primary text-white font-extrabold text-[15px] shadow-lg active:scale-[0.98] transition-transform cursor-pointer disabled:opacity-70"
          >
            {flow.isSubmitting ? 'Starting...' : 'Next'}
            {!flow.isSubmitting && (
              <ChevronLeft size={16} className="rotate-180 ml-1 shrink-0" strokeWidth={3} />
            )}
          </Button>
        </div>
      )}

      {/* Security footer */}
      {!hasSelection && (
        <div className="flex items-center justify-center gap-1.5 py-4 shrink-0">
          <Shield size={16} className="text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-muted-foreground">
            All expenses are private and secure
          </span>
        </div>
      )}

      <CurrencyMismatchDrawer
        isOpen={!!flow.currencyMismatch}
        onClose={flow.closeCurrencyMismatch}
        mismatch={flow.currencyMismatch}
        isSubmitting={flow.isSubmitting}
        submitError={flow.submitError}
        onConfirm={flow.resolveCurrencyMismatch}
      />
    </div>
  )
}
