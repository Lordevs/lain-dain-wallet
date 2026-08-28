import { ShieldCheck, UserMinus, Ban, Crown } from 'lucide-react'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import ContactAvatar from './contact-avatar'

export interface MemberOptionData {
  id: string
  name: string
  initials: string
  avatarColor: string
  avatar?: string | null
  src?: string
  role?: 'owner' | 'admin' | 'member'
  isOwner?: boolean
  isAdmin: boolean
  owesText?: string // e.g. "Member · Owes you Rs. 2,000"
}

interface MemberOptionsDrawerProps {
  isOpen: boolean
  onClose: () => void
  member: MemberOptionData | null
  isCurrentUserOwner?: boolean
  onToggleAdmin?: (memberId: string) => void
  onTransferOwnership?: (memberId: string) => void
  onRemove?: (memberId: string) => void
  onBlockReport?: (memberId: string) => void
}

export default function MemberOptionsDrawer({
  isOpen,
  onClose,
  member,
  isCurrentUserOwner,
  onToggleAdmin,
  onTransferOwnership,
  onRemove,
  onBlockReport,
}: MemberOptionsDrawerProps) {
  if (!member) return null

  const roleLabel = member.isAdmin ? 'Admin' : 'Member'

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-[32px] border-t-0 pb-6 text-left focus:outline-none">
        {/* Header - Member Info */}
        <div className="flex items-center gap-3.5 px-6 pt-5 pb-5 border-b border-border-card/60">
          <ContactAvatar
            initials={member.initials}
            avatarColor={member.avatarColor}
            src={member.src || member.avatar || undefined}
            size="md"
          />
          <div className="flex flex-col text-left">
            <h4 className="font-extrabold text-[16px] text-foreground">
              {member.name}
            </h4>
            <span className="text-[12px] text-muted-foreground font-medium mt-0.5">
              {member.owesText || `${roleLabel} · On Lain Dain`}
            </span>
          </div>
        </div>

        {/* Action List Options */}
        <div className="flex flex-col divide-y divide-border-card/60">
          {/* Transfer Ownership (Only for Group Owner) */}
          {isCurrentUserOwner && !member.isOwner && onTransferOwnership && (
            <button
              type="button"
              onClick={() => {
                onTransferOwnership(member.id)
                onClose()
              }}
              className="flex items-center gap-4 px-6 py-4 hover:bg-muted/5 transition-colors cursor-pointer border-0 bg-transparent text-left w-full outline-none"
            >
              <div className="w-11 h-11 rounded-[14px] bg-[#E3F2FD] flex items-center justify-center text-[#1976D2] shrink-0">
                <Crown size={20} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-[15px] text-foreground">
                Make Group Owner
              </span>
            </button>
          )}

          {/* Make / Remove Admin (Not applicable to the Owner) */}
          {onToggleAdmin && !member.isOwner && (
            <button
              type="button"
              onClick={() => {
                onToggleAdmin(member.id)
                onClose()
              }}
              className="flex items-center gap-4 px-6 py-4 hover:bg-muted/5 transition-colors cursor-pointer border-0 bg-transparent text-left w-full outline-none"
            >
              <div className="w-11 h-11 rounded-[14px] bg-[#E8F5E9] flex items-center justify-center text-positive shrink-0">
                <ShieldCheck size={20} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-[15px] text-foreground">
                {member.isAdmin ? 'Remove Admin' : 'Make Admin'}
              </span>
            </button>
          )}

          {/* Remove from Group */}
          {onRemove && !member.isOwner && (
            <button
              type="button"
              onClick={() => {
                onRemove(member.id)
                onClose()
              }}
              className="flex items-center gap-4 px-6 py-4 hover:bg-muted/5 transition-colors cursor-pointer border-0 bg-transparent text-left w-full outline-none"
            >
              <div className="w-11 h-11 rounded-[14px] bg-[#FFF5F0] flex items-center justify-center text-orange-payable shrink-0">
                <UserMinus size={20} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-[15px] text-orange-payable">
                Remove from Group
              </span>
            </button>
          )}

          {/* Block & Report */}
          {onBlockReport && !member.isOwner && (
            <button
              type="button"
              onClick={() => {
                onBlockReport(member.id)
                onClose()
              }}
              className="flex items-center gap-4 px-6 py-4 hover:bg-muted/5 transition-colors cursor-pointer border-0 bg-transparent text-left w-full outline-none"
            >
              <div className="w-11 h-11 rounded-[14px] bg-[#FFF5F0] flex items-center justify-center text-orange-payable shrink-0">
                <Ban size={20} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-[15px] text-orange-payable">
                Block & Report
              </span>
            </button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
