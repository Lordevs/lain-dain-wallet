import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { type SplitMember } from './use-split-expense'

interface UnequalSplitViewProps {
  members: SplitMember[]
  unequalAmounts: Record<string, string>
  unequalRemaining: number
  totalAmount: number
  onUnequalChange: (id: string, val: string) => void
  onReset: () => void
}

export default function UnequalSplitView({
  members,
  unequalAmounts,
  unequalRemaining,
  totalAmount,
  onUnequalChange,
  onReset,
}: UnequalSplitViewProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Unequal split warning row */}
      <div className="flex items-center justify-between text-xs font-bold text-[#C0392B] px-1 mb-4 select-none shrink-0">
        <span className="flex items-center gap-1.5">
          <AlertTriangle size={14} className="text-[#C0392B] fill-[#C0392B]/10" />
          Rs. {Math.abs(unequalRemaining).toLocaleString('en-US')} {unequalRemaining > 0 ? 'remaining' : 'over split'}
        </span>
        <span className="text-muted-faint">Total: Rs. {totalAmount.toLocaleString('en-US')}</span>
      </div>

      {/* Members Heading Row */}
      <div className="flex items-center justify-between mb-2 shrink-0 select-none">
        <span className="text-xs font-bold text-muted-foreground">Set amount per person</span>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-positive font-bold text-xs bg-transparent border-0 cursor-pointer outline-none hover:opacity-85"
        >
          Reset
        </button>
      </div>

      {/* Scrollable Members List Box */}
      <div className="flex-1 overflow-y-auto border-[0.8px] rounded-lg border-divider divide-y divide-divider bg-white mb-2 select-none">
        {members.map((member) => {
          return (
            <div
              key={member.id}
              className="px-6 py-4 flex items-center justify-between transition-colors bg-[#FDF8F4]"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="relative">
                  <Avatar className="size-10 shrink-0 font-extrabold text-sm text-white select-none">
                    <AvatarFallback className={cn("rounded-full flex items-center justify-center border-0 text-white font-extrabold text-sm", member.avatarColor)}>
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#14A558] border border-white rounded-full" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-foreground">{member.name}</span>
                  {member.isOrganizer && (
                    <span className="text-[10px] text-positive font-bold bg-[#E5F2EB] px-1.5 py-0.5 rounded-full mt-0.5 self-start leading-none">
                      Organizer
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-[12px] border-[0.8px] border-divider shadow-[0px_1px_4px_rgba(0,0,0,0.02)]">
                <span className="text-xs text-muted-faint font-bold">Rs.</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={unequalAmounts[member.id]}
                  onChange={(e) => onUnequalChange(member.id, e.target.value)}
                  className="w-18 bg-transparent border-0 outline-none text-sm font-extrabold text-foreground text-right font-sans py-0"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
