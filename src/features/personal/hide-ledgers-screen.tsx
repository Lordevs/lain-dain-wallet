import { useState } from 'react'
import { Info, Search, Check } from 'lucide-react'
import { useContactStore } from '@/store/use-contact-store'
import FlowHeader from '@/components/shared/flow-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import ContactAvatar from '@/components/shared/contact-avatar'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  ItemActions,
} from '@/components/ui/item'

export default function HideLedgersScreen() {
  const { contacts, hiddenLedgerIds, setHiddenLedgerIds } = useContactStore()

  const [search, setSearch] = useState('')

  // Track selected (hidden) ledger IDs. If checked/selected, it is hidden from main screen.
  const [selectedIds, setSelectedIds] = useState<string[]>(() => hiddenLedgerIds)

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSave = () => {
    setHiddenLedgerIds(selectedIds)
    // Go back
    window.history.back()
  }

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const groups = filteredContacts.filter((c) => c.type === 'group')
  const people = filteredContacts.filter((c) => c.type === 'person')

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none overflow-hidden">
      {/* Top Header */}
      <FlowHeader
        title="Hide ledgers"
        backVariant="circle"
        rightSlot={
          <button
            onClick={handleSave}
            className="text-positive font-bold text-base bg-transparent border-0 cursor-pointer outline-none hover:opacity-85"
          >
            Save
          </button>
        }
      />

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 flex flex-col gap-5 mt-2">
        {/* Info Banner */}
        <div className="bg-[#E4F2EB] border-[1.5px] border-[#0B683A26] rounded-[14px] p-5 text-left flex flex-col gap-2 shadow-[0px_4px_16px_rgba(0,0,0,0.01)]">
          <h4 className="text-[13px] font-bold text-positive flex items-center gap-2">
            <Info size={18} strokeWidth={2.5} className="shrink-0" />
            What is hiding ledgers?
          </h4>
          <p className="text-[13px] text-[#6B6B6B] font-normal leading-relaxed">
            Choose which groups and people appear in your expense overview. Select any you want to hide from the main screen.
          </p>
        </div>

        {/* Search Bar section */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-semibold text-[#6B6B6B] tracking-[0.8px] mb-1 px-1 uppercase">
            Choose what shows
          </h4>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9590]">
              <Search size={18} />
            </span>
            <Input
              type="text"
              placeholder="Search groups or contacts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 pl-12 pr-4 rounded-full border-[0.98px] border-[#EFE7DD] bg-white text-foreground text-sm placeholder:text-[#9A9590] shadow-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
            />
          </div>
        </div>

        {/* Groups list card */}
        {groups.length > 0 && (
          <div className="flex flex-col text-left">
            <h4 className="text-[11px] font-semibold text-[#6B6B6B] tracking-[0.8px] mb-2.5 px-1 uppercase">
              Groups
            </h4>
            <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y-[1.5px]! divide-[#EBEBEB]! overflow-hidden text-left">
              {groups.map((g) => {
                const isSelected = selectedIds.includes(g.id)
                return (
                  <Item
                    key={g.id}
                    onClick={() => handleToggle(g.id)}
                    className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer rounded-none border-0"
                  >
                    <ItemMedia>
                      <ContactAvatar
                        initials={g.initials}
                        avatarColor={g.avatarColor}
                        size="md"
                      />
                    </ItemMedia>
                    <ItemContent className="text-left ml-3">
                      <ItemTitle className="text-[15px] font-bold text-positive leading-tight truncate">
                        {g.name}
                      </ItemTitle>
                      <ItemDescription className="text-[12px] font-medium text-[#6B6B6B] mt-0.5">
                        {g.ledgerCount} members
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      {/* Checkbox circle */}
                      <div className={cn(
                        "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                        isSelected ? "border-positive bg-positive" : "border-[#D1D1D6]"
                      )}>
                        {isSelected && (
                          <Check size={14} className="text-white stroke-[3px]" />
                        )}
                      </div>
                    </ItemActions>
                  </Item>
                )
              })}
            </div>
          </div>
        )}

        {/* People list card */}
        {people.length > 0 && (
          <div className="flex flex-col text-left">
            <h4 className="text-[11px] font-semibold text-[#6B6B6B] tracking-[0.8px] mb-2.5 px-1 uppercase">
              People (1-to-1)
            </h4>
            <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y-[1.5px]! divide-[#EBEBEB]! overflow-hidden text-left">
              {people.map((p) => {
                const isSelected = selectedIds.includes(p.id)
                return (
                  <Item
                    key={p.id}
                    onClick={() => handleToggle(p.id)}
                    className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer rounded-none border-0"
                  >
                    <ItemMedia>
                      <ContactAvatar
                        initials={p.initials}
                        avatarColor={p.avatarColor}
                        size="md"
                      />
                    </ItemMedia>
                    <ItemContent className="text-left ml-3">
                      <ItemTitle className="text-[15px] font-bold text-positive leading-tight truncate">
                        {p.name}
                      </ItemTitle>
                      <ItemDescription className="text-[12px] font-medium text-[#6B6B6B] mt-0.5">
                        Personal ledger
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      {/* Checkbox circle */}
                      <div className={cn(
                        "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                        isSelected ? "border-positive bg-positive" : "border-[#D1D1D6]"
                      )}>
                        {isSelected && (
                          <Check size={14} className="text-white stroke-[3px]" />
                        )}
                      </div>
                    </ItemActions>
                  </Item>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-3 left-3 right-3 z-10">
        <Button
          onClick={handleSave}
          className="w-full max-w-md h-14 rounded-full bg-positive hover:bg-positive/95 text-white font-bold text-base"
        >
          Save Default View
        </Button>
      </div>
    </div>
  )
}
