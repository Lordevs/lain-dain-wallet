import { useState, useMemo } from 'react'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Drawer, DrawerContent, FULLSCREEN_DRAWER_CN } from '@/components/ui/drawer'
import SearchBar from '@/components/shared/search-bar'
import ContactListItem from '@/components/shared/contact-list-item'
import SelectedMembersStrip from '@/components/shared/selected-members-strip'
import ContactListSkeleton from '@/components/shared/contact-list-skeleton'
import FormError from '@/components/shared/form-error'
import CurrencyRateFields from './currency-rate-fields'
import { useContactsQuery } from '@/features/contacts/api/use-contacts-query'
import { useDeviceContactsSync } from '@/features/contacts/hooks/use-device-contacts-sync'
import { useAddMembersMutation } from '@/features/groups/api/use-group-actions-mutations'
import { useSetGroupCurrencyRateMutation } from '@/features/groups/api/use-group-currency-rate-mutations'
import { mapSyncedContactToContactInfo } from '@/features/contacts/lib/map-synced-contact'

interface AddGroupMemberDrawerProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupCurrency: string
  currencyRates: Array<{ currency: string; rate: string }>
  existingMemberUserIds: string[]
}

export default function AddGroupMemberDrawer({
  isOpen,
  onClose,
  groupId,
  groupCurrency,
  currencyRates,
  existingMemberUserIds,
}: AddGroupMemberDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [rateValues, setRateValues] = useState<Record<string, string>>({})

  // Unlike the New Contact/Group flow (useNewContactFlow), this drawer used
  // to only ever read whatever Contact rows already existed — never
  // syncing itself. That's invisible for an account that's already synced
  // via that other flow at some point, but shows an empty list for one
  // that hasn't (a freshly (re)created account being the common case) —
  // same "re-check OS permission, silently re-sync if granted" behavior
  // as every other contact-picker screen.
  useDeviceContactsSync()
  const contactsQuery = useContactsQuery(true, searchQuery)
  const addMembersMutation = useAddMembersMutation(groupId)
  const setRateMutation = useSetGroupCurrencyRateMutation(groupId)

  // Filter out users who are already in the group
  const availableContacts = useMemo(() => {
    return contactsQuery.contacts.filter(
      (c) => c.lain_dain_user_id && !existingMemberUserIds.includes(c.lain_dain_user_id)
    )
  }, [contactsQuery.contacts, existingMemberUserIds])

  const selectedList = useMemo(() => {
    return availableContacts
      .filter((c) => c.lain_dain_user_id && selectedUserIds.includes(c.lain_dain_user_id))
      .map(mapSyncedContactToContactInfo)
  }, [availableContacts, selectedUserIds])

  const missingCurrencies = useMemo(() => {
    const configured = new Set(currencyRates.map((rate) => rate.currency.toUpperCase()))
    const baseCurrency = groupCurrency.toUpperCase()
    return [
      ...new Set(
        availableContacts
          .filter(
            (contact) =>
              contact.lain_dain_user_id
              && selectedUserIds.includes(contact.lain_dain_user_id),
          )
          .map((contact) => contact.lain_dain_user_currency?.toUpperCase())
          .filter(
            (currency): currency is string =>
              !!currency
              && currency !== baseCurrency
              && !configured.has(currency),
          ),
      ),
    ]
  }, [availableContacts, currencyRates, groupCurrency, selectedUserIds])

  const ratesAreValid = missingCurrencies.every(
    (currency) => Number(rateValues[currency] ?? 0) > 0,
  )

  const toggleContact = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleAddMembers = async () => {
    if (selectedUserIds.length === 0) return
    try {
      for (const currency of missingCurrencies) {
        await setRateMutation.mutateAsync({
          currency,
          rate: rateValues[currency],
        })
      }
      await addMembersMutation.mutateAsync(selectedUserIds)
      toast.success(
        selectedUserIds.length === 1
          ? 'Member added!'
          : `${selectedUserIds.length} members added!`
      )
      setSelectedUserIds([])
      setRateValues({})
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add members.')
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DrawerContent className={FULLSCREEN_DRAWER_CN}>
        <div className="flex-1 flex flex-col bg-[#FEFAF1] text-foreground select-none overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0 relative">
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-full bg-background border border-divider text-foreground flex items-center justify-center cursor-pointer hover:bg-muted/10 outline-none"
            >
              <X size={16} className="text-muted-foreground" />
            </button>
            <h3 className="text-lg font-extrabold text-foreground absolute left-1/2 -translate-x-1/2">
              Add Members
            </h3>
            <div className="size-8" />
          </div>

          <div className="px-6 flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <SearchBar
              id="add-group-member-search"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search contacts on Lain Dain"
              className="my-3 shrink-0"
            />

            {/* Selected members strip */}
            {selectedList.length > 0 && (
              <SelectedMembersStrip
                members={selectedList}
                onRemove={(id) => toggleContact(id)}
                className="shrink-0 mb-2"
              />
            )}

            {missingCurrencies.length > 0 && (
              <div className="shrink-0 mb-4">
                <h4 className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-[0.08em] mb-2">
                  Rates required before adding
                </h4>
                <CurrencyRateFields
                  baseCurrency={groupCurrency}
                  currencies={missingCurrencies}
                  values={rateValues}
                  onChange={(currency, rate) => {
                    setRateValues((current) => ({ ...current, [currency]: rate }))
                  }}
                />
              </div>
            )}

            {/* Contact list */}
            <div className="flex-1 overflow-y-auto pb-4">
              {contactsQuery.isLoading && <ContactListSkeleton />}

              {!contactsQuery.isLoading && availableContacts.length === 0 && (
                <p className="text-center text-sm text-muted-foreground my-8 font-medium">
                  {searchQuery ? 'No contacts found.' : 'All contacts are already in this group.'}
                </p>
              )}

              <div className="space-y-1">
                {availableContacts.map((contact) => {
                  if (!contact.lain_dain_user_id) return null
                  const isChecked = selectedUserIds.includes(contact.lain_dain_user_id)
                  const contactInfo = mapSyncedContactToContactInfo(contact)

                  return (
                    <ContactListItem
                      key={contact.id}
                      contact={contactInfo}
                      subtitle={<span className="text-positive text-xs font-semibold">On Lain Dain</span>}
                      onClick={() => toggleContact(contact.lain_dain_user_id!)}
                      isHighlighted={isChecked}
                      rightSlot={
                        <div
                          className={`w-6 h-6 rounded-full border-[1.5px] transition-all flex items-center justify-center ${isChecked
                            ? 'bg-positive border-positive text-white'
                            : 'border-divider bg-white'
                            }`}
                        >
                          {isChecked && <Check size={14} strokeWidth={3} className="text-white" />}
                        </div>
                      }
                      className="py-3 px-4 rounded-[16px] bg-white border border-[#EFE7DD] mb-2"
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="px-6 py-5 shrink-0">
            <FormError
              message={setRateMutation.error?.message ?? addMembersMutation.error?.message}
              className="mb-3 justify-center"
            />
            <button
              type="button"
              onClick={handleAddMembers}
              disabled={
                selectedUserIds.length === 0
                || !ratesAreValid
                || addMembersMutation.isPending
                || setRateMutation.isPending
              }
              className="w-full h-14 rounded-full bg-positive text-white font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center outline-none border-0"
            >
              {addMembersMutation.isPending || setRateMutation.isPending
                ? 'Adding…'
                : selectedUserIds.length === 0
                  ? 'Select Members'
                  : `Add ${selectedUserIds.length} Member${selectedUserIds.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
