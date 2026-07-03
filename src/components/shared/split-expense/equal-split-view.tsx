import { Check, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { type SplitMember } from './use-split-expense'

interface EqualSplitViewProps {
  members: SplitMember[]
  selectedMembers: string[]
  equalSplitAmount: number
  numSelected: number
  onToggleMember: (id: string) => void
  onSelectAllToggle: () => void
}

export default function EqualSplitView({
  members,
  selectedMembers,
  equalSplitAmount,
  numSelected,
  onToggleMember,
  onSelectAllToggle,
}: EqualSplitViewProps) {

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Equal split summary row */}
      <div className="flex items-center gap-2 mb-4 shrink-0 select-none text-left">
        <div className="w-6 h-6 rounded-full bg-positive flex items-center justify-center text-white shrink-0">
          <Users size={12} className="text-white" />
        </div>
        <span className="text-[13px] font-bold text-foreground">
          {numSelected} people <span className="text-muted-foreground font-semibold">· Rs. {equalSplitAmount.toLocaleString('en-US')} each</span>
        </span>
      </div>

      {/* Members Heading Row */}
      <div className="flex items-center justify-between mb-2 shrink-0 select-none">
        <span className="text-xs font-bold text-muted-foreground">Members</span>
        <button
          type="button"
          onClick={onSelectAllToggle}
          className="text-xs font-bold text-positive bg-transparent border-0 cursor-pointer flex items-center gap-1.5 outline-none hover:opacity-85"
        >
          Select all
          <Check size={14} className="border border-positive rounded p-0.5 size-4" />
        </button>
      </div>

      {/* Scrollable Members List Box */}
      <div className="flex-1 overflow-y-auto border-[0.8px] rounded-lg border-divider divide-y divide-divider bg-white mb-2 select-none">
        {members.map((member) => {
          const isSelected = selectedMembers.includes(member.id)

          return (
            <div
              key={member.id}
              className="px-6 py-4 flex items-center justify-between transition-colors bg-[#FDF8F4]"
            >
              <div className="flex items-center gap-3 text-left">
                <button
                  type="button"
                  onClick={() => onToggleMember(member.id)}
                  className="size-5 rounded border-0 p-0 flex items-center justify-center shrink-0 cursor-pointer outline-none active:scale-95"
                >
                  {isSelected ? (
                    <div className="size-5 rounded-[6px] bg-positive flex items-center justify-center text-white">
                      <Check size={12} strokeWidth={4} className="text-white" />
                    </div>
                  ) : (
                    <div className="size-5 rounded-[6px] border-[1.5px] border-[#D4CFC8] bg-transparent" />
                  )}
                </button>
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

              <span className={cn('font-semibold text-sm text-foreground', !isSelected && 'opacity-30')}>
                Rs. {isSelected ? equalSplitAmount.toLocaleString('en-US') : '0'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
