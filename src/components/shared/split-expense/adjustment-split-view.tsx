import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { type SplitMember } from './use-split-expense'

interface AdjustmentSplitViewProps {
  members: SplitMember[]
  adjustmentAmounts: Record<string, string>
  totalAmount: number
  getAdjustmentFinalAmount: (id: string) => number
  onAdjustmentChange: (id: string, val: string) => void
  onReset: () => void
}

export default function AdjustmentSplitView({
  members,
  adjustmentAmounts,
  totalAmount,
  getAdjustmentFinalAmount,
  onAdjustmentChange,
  onReset,
}: AdjustmentSplitViewProps) {
  return (
    <div className="flex flex-col">
      {/* Adjustment split overview row */}
      <div className="flex items-center justify-between mb-4 shrink-0 select-none text-left">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-positive flex items-center justify-center text-white shrink-0">
            <Users size={12} className="text-white" />
          </div>
          <span className="text-[13px] font-bold text-foreground">
            {members.length} people
          </span>
        </div>
        <span className="text-xs text-muted-faint font-semibold">Total: Rs. {totalAmount.toLocaleString('en-US')}</span>
      </div>

      {/* Members Heading Row */}
      <div className="flex items-center justify-between mb-2 shrink-0 select-none">
        <span className="text-xs font-bold text-muted-foreground">Members</span>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-[#C0392B] font-bold text-xs bg-transparent border-0 cursor-pointer outline-none hover:opacity-85"
        >
          Reset
        </button>
      </div>

      {/* Scrollable Members List Box */}
      <div className="border-[0.8px] rounded-lg border-divider divide-y divide-divider bg-white mb-2 select-none overflow-hidden">
        {members.map((member) => {
          return (
            <div
              key={member.id}
              className="px-6 py-4 flex items-center justify-between transition-colors bg-transparent"
            >
              <div className="flex items-center gap-3 text-left min-w-0 flex-1 mr-3">
                <div className="relative shrink-0">
                  <Avatar className="size-10 shrink-0 font-extrabold text-sm text-white select-none">
                    <AvatarFallback className={cn("rounded-full flex items-center justify-center border-0 text-white font-extrabold text-sm", member.avatarColor)}>
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#14A558] border border-white rounded-full" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm text-foreground truncate">{member.name}</span>
                  {member.isOrganizer && (
                    <span className="text-[10px] text-positive font-bold bg-[#E5F2EB] px-1.5 py-0.5 rounded-full mt-0.5 self-start leading-none shrink-0">
                      Organizer
                    </span>
                  )}
                </div>
              </div>

              {/* Right side controls */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex flex-col text-right shrink-0">
                  <span className="text-[10px] text-muted-faint font-semibold">Final Amount</span>
                  <span className="text-sm font-extrabold text-positive mt-0.5 whitespace-nowrap">
                    Rs. {getAdjustmentFinalAmount(member.id).toLocaleString('en-US')}
                  </span>
                </div>
                <div className="flex flex-col shrink-0">
                  <span className="text-[10px] text-muted-faint font-semibold mb-1 text-left">owes extra</span>
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-[12px] border-[0.8px] border-divider shadow-[0px_1px_4px_rgba(0,0,0,0.02)] w-20">
                    <span className="text-xs text-muted-faint font-bold shrink-0">Rs.</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={adjustmentAmounts[member.id]}
                      onChange={(e) => onAdjustmentChange(member.id, e.target.value)}
                      className="w-full bg-transparent border-0 outline-none text-xs font-extrabold text-foreground text-right font-sans py-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
