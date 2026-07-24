import { useState } from 'react'
import { Info } from 'lucide-react'
import { useFriendshipsQuery } from '@/features/contacts/api/use-friendships-query'
import { useGroupsQuery } from '@/features/contacts/api/use-groups-query'
import { usePersonalExpenseSettingsQuery } from '@/features/expenses/api/use-personal-expense-settings-query'
import { useUpdatePersonalExpenseSettingsMutation } from '@/features/expenses/api/use-update-personal-expense-settings-mutation'
import { colorForName, initialsForName } from '@/lib/avatar-visuals'
import FlowHeader from '@/components/shared/flow-header'
import SearchBar from '@/components/shared/search-bar'
import ContactListSkeleton from '@/components/shared/contact-list-skeleton'
import { cn } from '@/lib/utils'
import ContactAvatar from '@/components/shared/contact-avatar'

interface LedgerItem {
  id: string
  kind: 'friendship' | 'group'
  name: string
  subtitle: string
  initials: string
  avatarColor: string
}

export default function HideLedgersScreen() {
  const friendshipsQuery = useFriendshipsQuery()
  const groupsQuery = useGroupsQuery()
  const settingsQuery = usePersonalExpenseSettingsQuery()

  const isLoading = friendshipsQuery.isLoading || groupsQuery.isLoading || settingsQuery.isLoading

  if (isLoading || !friendshipsQuery.data || !groupsQuery.data || !settingsQuery.data) {
    return (
      <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none overflow-hidden text-left relative">
        <FlowHeader title="Hide from My Expenses" backVariant="circle" />
        <div className="flex-1 px-6 pb-12 mt-3">
          <ContactListSkeleton />
        </div>
      </div>
    )
  }

  const items: LedgerItem[] = [
    ...friendshipsQuery.data.map((f) => ({
      id: f.id,
      kind: 'friendship' as const,
      name: f.friend.full_name,
      subtitle: 'Personal ledger',
      initials: initialsForName(f.friend.full_name),
      avatarColor: colorForName(f.friend.full_name),
    })),
    ...groupsQuery.data.map((g) => ({
      id: g.id,
      kind: 'group' as const,
      name: g.name,
      subtitle: `${g.members.length} member${g.members.length === 1 ? '' : 's'}`,
      initials: initialsForName(g.name),
      avatarColor: colorForName(g.name),
    })),
  ]

  // Mounted only once real data exists, so its own useState lazy
  // initializer picks up the real hidden ids on first render.
  return (
    <HideLedgersForm
      items={items}
      initialSelectedIds={[...settingsQuery.data.hidden_friendship_ids, ...settingsQuery.data.hidden_group_ids]}
    />
  )
}

function HideLedgersForm({ items, initialSelectedIds }: { items: LedgerItem[]; initialSelectedIds: string[] }) {
  const updateSettings = useUpdatePersonalExpenseSettingsMutation()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSave = () => {
    setSaveError(null)
    const selectedFriendshipIds = items.filter((i) => i.kind === 'friendship' && selectedIds.includes(i.id)).map((i) => i.id)
    const selectedGroupIds = items.filter((i) => i.kind === 'group' && selectedIds.includes(i.id)).map((i) => i.id)
    updateSettings.mutate(
      { hidden_friendship_ids: selectedFriendshipIds, hidden_group_ids: selectedGroupIds },
      {
        onSuccess: () => window.history.back(),
        onError: (err) => setSaveError(err.message),
      },
    )
  }

  const filteredList = items.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const selectedItems = items.filter((c) => selectedIds.includes(c.id))

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none overflow-hidden text-left relative">
      {/* Main Screen Header */}
      <FlowHeader
        title="Hide from My Expenses"
        backVariant="circle"
        rightSlot={
          <button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="text-positive font-bold text-[15px] bg-transparent border-0 cursor-pointer outline-none hover:opacity-85 disabled:opacity-50"
          >
            Save
          </button>
        }
      />

      {/* Main screen body */}
      <div className="flex-1 overflow-y-auto px-6 pb-12 flex flex-col gap-6 mt-3">
        {/* Info Banner */}
        {!searchQuery && (
          <div className="bg-[#E4F2EB] border-[1.5px] border-[#0B683A26] rounded-[14px] p-5 flex flex-col gap-2 shadow-[0px_4px_16px_rgba(0,0,0,0.01)] text-left">
            <h4 className="text-[13px] font-bold text-positive flex items-center gap-2 leading-tight">
              <Info size={18} strokeWidth={2.5} className="shrink-0" />
              Choose the groups or people you don't want to include in My Expenses.
            </h4>
            <p className="text-[13px] text-[#6B6B6B] font-normal leading-tight">
              hidden balances wont appear in your personal 'My Expenses'.
            </p>
          </div>
        )}

        {saveError && (
          <p className="text-sm font-semibold text-tertiary text-center">{saveError}</p>
        )}

        {/* Search Groups Block */}
        <div className="flex flex-col text-left">
          {!searchQuery && (
            <h4 className="text-[11px] font-bold text-[#9A9590] tracking-[0.8px] mb-2 uppercase">
              Choose what to hide
            </h4>
          )}
          <SearchBar
            id="hide-ledgers-search"
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="Search groups or contacts..."
          />
        </div>

        {/* Selected Strip (MEMBERS) - Displays all hidden groups and contacts */}
        {!searchQuery && selectedItems.length > 0 && (
          <div className="flex flex-col text-left">
            <h4 className="text-[11px] font-bold text-[#9A9590] tracking-[0.8px] mb-3 uppercase">
              Members({selectedItems.length})
            </h4>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="relative flex flex-col items-center shrink-0"
                >
                  <div className="relative">
                    <div className="p-0.5 rounded-full border-[2.2px] border-primary bg-background">
                      <ContactAvatar
                        initials={item.initials}
                        avatarColor={item.avatarColor}
                        size="md"
                      />
                    </div>
                    {/* Remove red badge overlay */}
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#E53E3E] text-white border-[1.5px] border-white flex items-center justify-center font-bold text-[10px] cursor-pointer hover:bg-[#E53E3E]/90 shadow-sm"
                    >
                      ×
                    </button>
                  </div>
                  <span className="text-[11px] font-medium text-foreground mt-1 max-w-[56px] truncate text-center">
                    {item.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Groups & Contacts list */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-bold text-[#9A9590] tracking-[0.8px] mb-3 uppercase">
            Groups & Contacts
          </h4>
          <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EBEBEB] overflow-hidden">
            {filteredList.map((item) => {
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
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Rounded Checkbox */}
                  <div className={cn(
                    "w-6 h-6 rounded-full border flex items-center justify-center transition-all shrink-0",
                    isSelected ? "border-positive bg-positive text-white" : "border-[#D1D1D6] bg-white"
                  )}>
                    {isSelected && (
                      <span className="text-white font-extrabold text-sm flex items-center justify-center">✓</span>
                    )}
                  </div>
                </div>
              )
            })}

            {filteredList.length === 0 && (
              <div className="p-8 text-center text-[#6B6B6B] text-sm">
                No groups or contacts found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
