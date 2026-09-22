import { Check, Users, Shield, ChevronLeft, Contact as ContactIcon, LoaderCircle, RefreshCw } from 'lucide-react'
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
import { createPortal } from 'react-dom'

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
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-6 pb-4 scrollbar-none">
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

      {flow.syncStatus === 'declined' && (
        <Button type="button" variant="ghost" onClick={flow.showContactsConsent} className="mb-5 self-start text-xs font-bold text-primary">
          Enable contact syncing
        </Button>
      )}
      {flow.syncStatus === 'prompt' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6" onClick={flow.declineContactsAccess}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contacts-consent-title"
            aria-describedby="contacts-consent-description"
            className="w-full max-w-sm rounded-[24px] bg-white px-6 py-7 text-center shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#E4F2EB] text-primary">
              <ContactIcon size={26} strokeWidth={2} />
            </div>
            <h2 id="contacts-consent-title" className="text-lg font-bold text-foreground">Find friends on Lain Dain?</h2>
            <p id="contacts-consent-description" className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Allow Lain Dain to upload your contacts’ names and phone numbers to our server to find friends and show people you can invite.
              Contacts will be used once they have been uploaded to a server.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button type="button" onClick={() => void flow.requestContactsAccess()} className="h-11 w-full rounded-full font-bold">
                Allow contact sync
              </Button>
              <Button type="button" variant="ghost" onClick={flow.declineContactsAccess} className="h-10 w-full rounded-full font-semibold">
                Not now
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
      {flow.syncStatus === 'denied' && (
        <p className="text-xs text-muted-foreground mb-5 px-1 shrink-0">
          Contacts access is off — enable it in your device settings to see who's already on Lain Dain.
        </p>
      )}
      {(flow.syncStatus === 'checking' || flow.isSyncing) && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-center gap-3 rounded-xl border border-border-card bg-white px-4 py-3 shadow-[0px_2px_8px_0px_#00000005]"
        >
          <LoaderCircle className="size-5 shrink-0 animate-spin text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">Syncing contacts</p>
            <p className="text-xs text-muted-foreground">Finding people you already know on Lain Dain…</p>
          </div>
        </div>
      )}
      {flow.syncError && !flow.isSyncing && (
        <div className="mb-4">
          <FormError message={flow.syncError} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void flow.resyncContacts()}
            className="mt-1 h-8 gap-1.5 px-1 text-xs font-bold text-primary"
          >
            <RefreshCw className="size-3.5" />
            Try syncing again
          </Button>
        </div>
      )}
      <FormError message={flow.submitError} className="mb-4" />

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
                      onClick={() => shareInvite(contact.name, contact.phone ?? '')}
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

      {/* Security footer */}
      {!hasSelection && (
        <div className="flex items-center justify-center gap-1.5 py-4 shrink-0">
          <Shield size={16} className="text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-muted-foreground">
            All expenses are private and secure
          </span>
        </div>
      )}
      </div>

      {/* In-layout footer stays above the root device inset and cannot be
          clipped by Android navigation controls or the iOS home indicator. */}
      {hasSelection && (
        <div className="z-10 shrink-0 bg-background px-6 pb-5 pt-3">
          <Button
            onClick={flow.nextStep}
            disabled={flow.isSubmitting}
            className="h-14 w-full cursor-pointer rounded-full bg-primary text-[15px] font-extrabold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-70"
          >
            {flow.isSubmitting ? 'Starting...' : 'Next'}
            {!flow.isSubmitting && (
              <ChevronLeft size={16} className="ml-1 shrink-0 rotate-180" strokeWidth={3} />
            )}
          </Button>
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
