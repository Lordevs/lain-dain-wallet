import { Check, Users, UserPlus, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import SearchBar from '@/components/shared/search-bar'
import QuickActionButton from '@/features/contacts/components/quick-action-button'
import ContactList from '@/components/shared/contact-list'
import ContactListItem from '@/components/shared/contact-list-item'
import { MOCK_INVITES } from '../data/mock-data'
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
          : 'border-[#D4CFC8] bg-transparent',
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
  return (
    <div className="flex-1 flex flex-col px-6 overflow-hidden">
      {/* Search */}
      <SearchBar
        id="choice-search"
        value={flow.searchQuery}
        onChange={flow.setSearchQuery}
        placeholder="Search by name or number"
        className="my-3 shrink-0"
      />

      {/* Quick Actions — New Group / New Contact */}
      <div className="bg-white border-[1.26px] border-[#EFE7DD] rounded-xl shadow-[0px_2px_8px_0px_#00000005] divide-y divide-[#EFE7DD] mb-5 overflow-hidden shrink-0">
        {/* New Group */}
        <QuickActionButton
          title="New Group"
          description="Split expenses with multiple people"
          icon={<Users strokeWidth={2} className='size-5.5' />}
          onClick={() => flow.setStep('add_members')}
          className='border-0 border-b-[1.26px] border-[#EFE7DD]'
        />

        {/* New Contact */}
        <QuickActionButton
          title="New Contact"
          description="Add someone by name or number"
          icon={<UserPlus strokeWidth={2} className='size-5.5' />}
          onClick={() => {
            // Placeholder/Logic for new contact when defined
          }}
        />
      </div>

      {/* Scrollable contact lists */}
      <div className="flex-1 overflow-y-auto pb-8 space-y-6">
        {/* Contacts on Lain Dain */}
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

        {/* Invite to Lain Dain */}
        <ContactList title="Invite to Lain Dain" titleColor="muted">
          {MOCK_INVITES.map((contact) => (
            <ContactListItem
              key={contact.id}
              contact={contact}
              contactNameClassName='text-[#A8A39C] font-medium'
              subtitle={<span className="text-[#6B6B6B]">{contact.phone}</span>}
              rightSlot={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-[10px] border-[1.26px] border-[#D4CFC8] text-xs font-bold px-4 bg-transparent! text-[#6B6B6B]"
                >
                  Invite
                </Button>
              }
            />
          ))}
        </ContactList>
      </div>

      {/* Security footer */}
      <div className="flex items-center justify-center gap-1.5 py-4 shrink-0">
        <Shield size={16} className="text-[#6B6B6B] shrink-0" />
        <span className="text-xs font-medium text-[#6B6B6B]">
          All expenses are private and secure
        </span>
      </div>
    </div>
  )
}
