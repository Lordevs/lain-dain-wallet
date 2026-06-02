import { ChevronLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useNavigate } from '@tanstack/react-router'
import { ROUTES } from '@/constants/routes'
import ContactAvatar from '@/components/shared/contact-avatar'
import type { NewContactFlowState } from '../hooks/use-new-contact-flow'

// ─── Props ────────────────────────────────────────────────────────────────────

interface GroupSuccessStepProps {
  flow: NewContactFlowState
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * GroupSuccessStep (Step 4) — celebration screen after a group is created.
 * Shows: animated check, group name, member names, stacked avatars,
 * and primary CTA / skip buttons.
 */
export default function GroupSuccessStep({ flow }: GroupSuccessStepProps) {
  const navigate = useNavigate()

  const memberSummary = (() => {
    const names = flow.selectedList.map((c) => c.name.split(' ')[0])
    if (names.length === 0) return ''
    if (names.length === 1) return `${names[0]} has been added.`
    const rest = names.slice(0, 3).join(', ')
    const suffix = flow.selectedList.length > 3 ? ' and others' : ''
    return `${rest}${suffix} have been added.`
  })()

  return (
    <div className="flex-1 flex flex-col justify-between px-6 pt-16 pb-8 relative">
      {/* Central success content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Checkmark circle */}
        <div className="w-24 h-24 rounded-full bg-[#DCEFE4] flex items-center justify-center">
          <Check className="text-primary size-12" strokeWidth={3} />
        </div>

        <h2 className="text-[26px] font-extrabold text-foreground mt-8 leading-tight">
          Group Created!
        </h2>
        <p className="text-[19px] font-bold text-primary mt-2">{flow.groupName}</p>
        <p className="text-[14px] text-muted-foreground mt-4 max-w-[260px]">{memberSummary}</p>

        {/* Stacked avatars */}
        <div className="flex -space-x-4 items-center justify-center mt-10">
          {/* Group initials chip */}
          <div className="w-12 h-12 rounded-full border-2 border-[#FDB105] bg-[#01592B] text-white flex items-center justify-center font-extrabold text-xs z-30 select-none">
            {flow.groupName.slice(0, 2).toUpperCase()}
          </div>

          {/* First 3 member avatars */}
          {flow.selectedList.slice(0, 3).map((contact, i) => (
            <ContactAvatar
              key={contact.id}
              initials={contact.initials}
              avatarColor={contact.avatarColor}
              size="md"
              className={cn(
                'border-2 border-[#FDB105]',
                i === 0 && 'z-20',
                i === 1 && 'z-10',
                i === 2 && 'z-0',
              )}
            />
          ))}
        </div>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col gap-4 mt-auto">
        <Button
          onClick={() => navigate({ to: ROUTES.DASHBOARD })}
          className="w-full h-14 rounded-full bg-primary text-white font-extrabold text-[15px] shadow-[0px_7.03px_23.42px_0px_#0B683A59] active:scale-[0.98] transition-transform cursor-pointer"
        >
          Add First Expense
          <ChevronLeft size={16} className="rotate-180 ml-1 shrink-0" strokeWidth={3} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate({ to: ROUTES.DASHBOARD })}
          className="text-sm font-extrabold text-[#FDB105] hover:text-[#FDB105]/80 hover:bg-transparent active:scale-95 transition-all h-auto py-2"
        >
          Skip
        </Button>
      </div>
    </div>
  )
}
