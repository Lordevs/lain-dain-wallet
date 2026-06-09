import {
  Check,
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
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import SelectedMembersStrip from '@/components/shared/selected-members-strip'
import CurrencySelectDrawer from '@/components/shared/currency-select-drawer'
import { MOCK_CATEGORIES } from '../data/mock-data'
import type { NewContactFlowState } from '../hooks/use-new-contact-flow'
import imagePlaceholder from '@/assets/image-placeholder.svg'

// ─── Props ────────────────────────────────────────────────────────────────────

interface GroupDetailsStepProps {
  flow: NewContactFlowState
}

// ─── Category Icon Map ─────────────────────────────────────────────────────────

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<any>> = {
  cat1: User,
  cat2: Users,
  cat3: Briefcase,
  cat4: Home,
  cat5: GraduationCap,
  cat6: Plane,
  cat7: DollarSign,
  cat8: AlertCircle,
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * GroupDetailsStep (Step 3) — fill in group name, description, currency, and
 * category. Members can still be added/removed via the strip.
 */
export default function GroupDetailsStep({ flow }: GroupDetailsStepProps) {
  return (
    <div className="flex-1 flex flex-col px-6 overflow-hidden">
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

      {/* Category list */}
      <h2 className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider mb-2 shrink-0">
        All Categories
      </h2>
      <div className="border-[0.8px] border-[#EBEBEB] rounded-xl bg-white shadow-[0px_2px_10px_0px_#0000000D] divide-y-[0.8px] divide-[#EBEBEB]">
        {MOCK_CATEGORIES.map((cat) => {
          const isSelected = flow.selectedCategory === cat.id
          const IconComponent = CATEGORY_ICON_MAP[cat.id] || AlertCircle

          return (
            <div
              key={cat.id}
              role="button"
              tabIndex={0}
              onClick={() => flow.setSelectedCategory(cat.id)}
              onKeyDown={(e) => e.key === 'Enter' && flow.setSelectedCategory(cat.id)}
              className={cn(
                'flex items-center justify-between p-3.5 cursor-pointer transition-colors',
                isSelected ? 'bg-[#E5F2EB]' : 'hover:bg-muted/10',
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-sm flex items-center justify-center select-none',
                    cat.bgColor,
                  )}
                >
                  <IconComponent className={cn('size-5', isSelected ? 'text-primary' : cat.iconColor)} />
                </div>
                <div>
                  <p
                    className={cn(
                      'font-bold text-[14px]',
                      isSelected ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {cat.name}
                  </p>
                  <p className={cn('text-[11px]', isSelected ? 'text-primary/80 font-medium' : 'text-muted-foreground')}>{cat.description}</p>
                </div>
              </div>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                  <Check size={14} strokeWidth={3.5} className="stroke-white" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Sticky Create Group button */}
      <div className="mt-20">
        <Button
          onClick={flow.createGroup}
          disabled={!flow.groupName.trim()}
          className="w-full h-14 rounded-full bg-primary text-white font-extrabold text-[15px] shadow-lg active:scale-[0.98] transition-transform cursor-pointer"
        >
          Create Group
        </Button>
      </div>
    </div>
  )
}
