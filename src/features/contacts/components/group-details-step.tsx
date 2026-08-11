import {
  Plus,
  Camera,
  User,
  Users,
  Briefcase,
  Home,
  GraduationCap,
  Plane,
  DollarSign,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import SelectedMembersStrip from '@/components/shared/selected-members-strip'
import CurrencySelectDrawer from '@/components/shared/currency-select-drawer'
import CurrencyRateFields from '@/features/groups/components/currency-rate-fields'
import { MOCK_CATEGORIES } from '../data/mock-data'
import FormError from '@/components/shared/form-error'
import type { NewContactFlowState } from '../hooks/use-new-contact-flow'
import imagePlaceholder from '@/assets/image-placeholder.svg'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'

// ─── Props ────────────────────────────────────────────────────────────────────

interface GroupDetailsStepProps {
  flow: NewContactFlowState
}

// ─── Category Icon Map ─────────────────────────────────────────────────────────

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  friends: User,
  family: Users,
  colleague: Briefcase,
  roommate: Home,
  classmate: GraduationCap,
  travel: Plane,
  business: DollarSign,
  other: AlertCircle,
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * GroupDetailsStep (Step 3) — fill in group name, description, currency, and
 * category. Members can still be added/removed via the strip.
 */
export default function GroupDetailsStep({ flow }: GroupDetailsStepProps) {
  const groupCurrency = flow.currency.toUpperCase()
  const requiredCurrencies = [
    ...new Set(
      flow.selectedList
        .map((contact) => contact.defaultCurrency?.toUpperCase())
        .filter((code): code is string => !!code && code !== groupCurrency),
    ),
  ]
  const canCreate = !!flow.groupName.trim() && !!flow.selectedCategory

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-6 pb-4 scrollbar-none">
      {/* Row 1: Group Avatar placeholder + Name Input */}
      <div className="flex gap-4 items-center mt-3 mb-3 shrink-0">
        {/* Group avatar input */}
        <div className="relative shrink-0">
          <label htmlFor="group-avatar-upload" className="cursor-pointer block group">
            <div className="p-0.5 rounded-full border-2 border-dashed border-primary/30 bg-[#FEFAF1] transition-colors group-hover:border-primary/50">
              <Avatar className="w-16 h-16 rounded-full border-0">
                {flow.groupAvatar ? (
                  <AvatarImage
                    src={flow.groupAvatar}
                    className="object-cover"
                    alt="Group avatar"
                  />
                ) : (
                  <AvatarImage
                    src={imagePlaceholder}
                    className="object-cover"
                    alt="Placeholder"
                  />
                )}
              </Avatar>
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center border-2 border-[#FEFAF1]">
              <Camera size={12} className="stroke-white fill-white" />
            </div>
          </label>
          <input
            id="group-avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const reader = new FileReader()
                reader.onloadend = () => {
                  flow.setGroupAvatar(reader.result as string)
                }
                reader.readAsDataURL(file)
              }
            }}
          />
        </div>

        {/* Group Name input */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder="GROUP NAME"
            value={flow.groupName}
            onChange={(e) => flow.setGroupName(e.target.value)}
            className="h-11 rounded-full bg-white! border-[1.26px] border-[#EFE7DD] text-sm font-bold placeholder:text-[#9A9590] focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all px-4"
          />
        </div>
      </div>

      {/* Row 2: Description input (full-width) */}
      <div className="mb-4 shrink-0">
        <Input
          type="text"
          placeholder="DESCRIPTION (OPTIONAL)"
          value={flow.description}
          onChange={(e) => flow.setDescription(e.target.value)}
          className="h-11 rounded-full bg-white! border-[1.26px] border-[#EFE7DD] text-xs font-semibold placeholder:text-[#9A9590] focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all px-4"
        />
      </div>

      {/* Members strip with inline "Add more" button */}
      <h2 className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider mb-2 shrink-0">
        Members ({flow.selectedContacts.length})
      </h2>
      <SelectedMembersStrip
        members={flow.selectedList}
        onRemove={flow.removeContact}
        className="shrink-0 mb-4"
        appendSlot={
          <div
            role="button"
            tabIndex={0}
            onClick={() => flow.setStep('add_members')}
            onKeyDown={(e) => e.key === 'Enter' && flow.setStep('add_members')}
            className="relative flex flex-col items-center shrink-0 cursor-pointer"
          >
            <div className="relative">
              <div className="p-0.5 rounded-full border-[2.2px] border-[#01592B] bg-[#FEFAF1]">
                <div className="w-11 h-11 rounded-full bg-[#E3F2FD] text-[#1E3A8A] flex items-center justify-center shrink-0">
                  <User className="size-[80%] fill-current" />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 size-4 rounded-full bg-primary border-[1.5px] border-[#FEFAF1] flex items-center justify-center text-white">
                <Plus className="size-2.5" strokeWidth={3.5} />
              </div>
            </div>
            <span className="text-[12px] font-medium text-foreground mt-1 text-center">Add</span>
          </div>
        }
      />

      {/* Currency */}
      <h2 className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider mb-2 shrink-0">
        Currency
      </h2>
      <CurrencySelectDrawer
        value={flow.currency}
        onChange={flow.setCurrency}
      />

      {requiredCurrencies.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">
            Member exchange rates
          </h2>
          <CurrencyRateFields
            baseCurrency={groupCurrency}
            currencies={requiredCurrencies}
            values={flow.currencyRates}
            onChange={flow.setCurrencyRate}
          />
        </div>
      )}

      {/* Category list */}
      <h2 className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider pt-6 mb-2 shrink-0">
        All Categories
      </h2>
      <RadioGroup
        value={flow.selectedCategory}
        onValueChange={flow.setSelectedCategory}
        className="grid gap-0 border-[0.8px] border-[#EBEBEB] rounded-xl bg-white shadow-[0px_2px_10px_0px_#0000000D] divide-y-[0.8px] divide-[#EBEBEB] overflow-hidden"
      >
        {MOCK_CATEGORIES.map((cat) => {
          const isSelected = flow.selectedCategory === cat.id
          const IconComponent = CATEGORY_ICON_MAP[cat.id] || AlertCircle

          return (
            <label
              key={cat.id}
              htmlFor={cat.id}
              className="w-full cursor-pointer"
            >
              <Item
                className={cn(
                  'flex items-center justify-between p-3.5 transition-colors rounded-none border-0',
                  isSelected ? 'bg-[#E5F2EB]' : 'hover:bg-muted/10',
                )}
              >
                <ItemMedia>
                  <div
                    className={cn(
                      'w-10 h-10 rounded-sm flex items-center justify-center select-none shrink-0',
                      cat.bgColor,
                    )}
                  >
                    <IconComponent className={cn('size-5', isSelected ? 'text-primary' : cat.iconColor)} />
                  </div>
                </ItemMedia>
                <ItemContent className="text-left ml-3">
                  <ItemTitle
                    className={cn(
                      'font-bold text-[14px] leading-snug',
                      isSelected ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {cat.name}
                  </ItemTitle>
                  <ItemDescription className={cn('text-[11px] leading-snug mt-0.5', isSelected ? 'text-[#01592B]/85 font-medium' : 'text-muted-foreground')}>
                    {cat.description}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <RadioGroupItem
                    value={cat.id}
                    id={cat.id}
                    className={cn(
                      "w-6 h-6 border-[1.5px] border-muted-foreground/30 shrink-0",
                      "data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    )}
                  />
                </ItemActions>
              </Item>
            </label>
          )
        })}
      </RadioGroup>

      </div>

      {/* In-layout footer cannot be covered by system navigation and leaves
          the category list all remaining height on short devices. */}
      {canCreate && (
        <div className="z-10 shrink-0 bg-background px-6 pb-5 pt-3">
          <FormError message={flow.submitError} className="mb-3 justify-center" />
          <Button
            onClick={flow.createGroup}
            disabled={flow.isSubmitting}
            className="h-14 w-full cursor-pointer rounded-full bg-primary text-[15px] font-extrabold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-70"
          >
            {flow.isSubmitting ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      )}
    </div>
  )
}
