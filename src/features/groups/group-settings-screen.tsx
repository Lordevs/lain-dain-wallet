import { useState, useMemo } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { MoreVertical, Camera, Pencil, Plus, LogOut, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'
import ContactListItem from '@/components/shared/contact-list-item'
import MemberOptionsDrawer from '@/components/shared/member-options-drawer'
import ProfilePicturePanel from '@/components/shared/profile-picture-panel'
import OutstandingBalanceDrawer from '@/components/shared/outstanding-balance-drawer'
import ConfirmActionDrawer from '@/components/shared/confirm-action-drawer'
import { ROUTES } from '@/constants/routes'
import { MOCK_RECEIVABLES, MOCK_PAYABLES } from '@/features/dashboard/data/mock-data'

export default function GroupSettingsScreen() {
  const { id } = useParams({ from: '/groups/$id/settings' })
  const navigate = useNavigate()

  // Find contact by id from mock data
  const contact = useMemo(() => {
    return [...MOCK_RECEIVABLES, ...MOCK_PAYABLES].find((c) => c.id === id)
  }, [id])

  // Local state for Smart Settle toggle
  const [smartSettleEnabled, setSmartSettleEnabled] = useState(true)

  // Local state for Group Cover Photo
  const [groupPhoto, setGroupPhoto] = useState<string | null>(null)
  const [isPhotoPanelOpen, setIsPhotoPanelOpen] = useState(false)

  // Local state for Group Name editing
  const [groupName, setGroupName] = useState(contact?.name || 'Murree Trip')
  const [isNamePanelOpen, setIsNamePanelOpen] = useState(false)
  const [tempGroupName, setTempGroupName] = useState(contact?.name || 'Murree Trip')

  // Local dynamic state for members list
  const [members, setMembers] = useState([
    {
      id: 'you',
      name: 'You',
      initials: 'MH',
      avatarColor: 'bg-[#0B683A] text-white',
      owesText: 'Admin · Group creator',
      isAdmin: true,
      isPending: false,
    },
    {
      id: 'ali',
      name: 'Ali Hassan',
      initials: 'AH',
      avatarColor: 'bg-[#2F80ED] text-white',
      owesText: 'Member · Owes you Rs. 2,000',
      isAdmin: false,
      isPending: false,
    },
    {
      id: 'sara',
      name: 'Sara Khan',
      initials: 'SK',
      avatarColor: 'bg-[#C96A1B] text-white',
      owesText: 'Admin · On Lain Dain',
      isAdmin: true,
      isPending: false,
    },
    {
      id: 'hassan',
      name: 'Hassan',
      initials: 'HS',
      avatarColor: 'bg-[#4F5D75] text-white',
      owesText: 'Member · On Lain Dain',
      isAdmin: false,
      isPending: false,
    },
    {
      id: 'usman',
      name: 'Usman Shah',
      initials: 'US',
      avatarColor: 'bg-[#5C6BC0] text-white',
      owesText: 'Member · Invited via link',
      isAdmin: false,
      isPending: true,
    },
  ])

  // State to manage Member Options Drawer
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  // Local state for Confirm and Outstanding Balance Drawers
  const [drawerConfig, setDrawerConfig] = useState<{
    type: 'outstanding' | 'confirm' | null
    title: string
    warningText?: string
    confirmTitle?: string
    confirmDescription?: string
    buttonText?: string
    buttonClassName?: string
    onAction?: () => void
  }>({
    type: null,
    title: '',
  })

  const selectedMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || null
  }, [members, selectedMemberId])

  const handleToggleAdmin = (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          const nextAdmin = !m.isAdmin
          return {
            ...m,
            isAdmin: nextAdmin,
            owesText: m.id === 'ali'
              ? 'Member · Owes you Rs. 2,000'
              : m.isPending
              ? 'Member · Invited via link'
              : `${nextAdmin ? 'Admin' : 'Member'} · On Lain Dain`
          }
        }
        return m
      })
    )
  }

  const handleRemoveMember = (memberId: string) => {
    setSelectedMemberId(null) // Close member options drawer
    const member = members.find((m) => m.id === memberId)
    if (!member) return

    // Ali Hassan has an outstanding balance (owes you Rs. 2,000)
    const hasBalance = member.owesText.includes('Owes') || member.owesText.includes('owes') || member.id === 'ali'

    if (hasBalance) {
      setDrawerConfig({
        type: 'outstanding',
        title: 'Permanently Remove the Member from the group',
        warningText: 'This member has unsettled balances in the group. Ask them to settle first before they can be removed.',
        buttonText: 'Settle Balance',
        onAction: () => {
          // Settle the balance and trigger the confirm drawer
          setMembers(prev => prev.map(m => m.id === memberId ? { ...m, owesText: 'Member · On Lain Dain' } : m))
          setTimeout(() => {
            setDrawerConfig({
              type: 'confirm',
              title: 'Permanently Remove the Member from the group',
              confirmTitle: 'Remove the account Permanently–',
              confirmDescription: "They'll lose access to the group and its expenses. Their past contributions will remain visible to other members.",
              buttonText: 'Confirm',
              onAction: () => {
                setMembers(prev => prev.filter(m => m.id !== memberId))
              }
            })
          }, 300)
        }
      })
    } else {
      setDrawerConfig({
        type: 'confirm',
        title: 'Permanently Remove the Member from the group',
        confirmTitle: 'Remove the account Permanently–',
        confirmDescription: "They'll lose access to the group and its expenses. Their past contributions will remain visible to other members.",
        buttonText: 'Confirm',
        onAction: () => {
          setMembers(prev => prev.filter(m => m.id !== memberId))
        }
      })
    }
  }

  const handleBlockReport = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
  }

  const handleLeaveGroup = () => {
    // Net balance check: check if any member owes us
    const hasBalances = members.some(m => m.owesText.toLowerCase().includes('owes'))

    if (hasBalances) {
      setDrawerConfig({
        type: 'outstanding',
        title: 'Leave the Murree Group Permanently',
        warningText: `You have unsettled balances in ${groupName}. You must settle all balances before you can leave the group.`,
        buttonText: 'Settle Balance',
        onAction: () => {
          // Settle balances, then open Confirm action drawer
          setMembers(prev => prev.map(m => m.owesText.toLowerCase().includes('owes') ? { ...m, owesText: 'Member · On Lain Dain' } : m))
          if (contact) {
            contact.netAmount = 0
          }
          setTimeout(() => {
            setDrawerConfig({
              type: 'confirm',
              title: 'Leave the Murree Group Permanently',
              confirmTitle: 'Leave Group permanently?',
              confirmDescription: "You'll lose access to this group and its expenses. Other members will still see your past contributions.",
              buttonText: 'Confirm',
              onAction: () => {
                navigate({ to: ROUTES.DASHBOARD })
              }
            })
          }, 300)
        }
      })
    } else {
      setDrawerConfig({
        type: 'confirm',
        title: 'Leave the Murree Group Permanently',
        confirmTitle: 'Leave Group permanently?',
        confirmDescription: "You'll lose access to this group and its expenses. Other members will still see your past contributions.",
        buttonText: 'Confirm',
        onAction: () => {
          navigate({ to: ROUTES.DASHBOARD })
        }
      })
    }
  }

  const handleDeleteGroup = () => {
    setDrawerConfig({
      type: 'confirm',
      title: 'Delete Group Permanently',
      confirmTitle: 'Delete Group permanently?',
      confirmDescription: 'This will permanently delete this group and all its expenses for all members. This action cannot be undone.',
      buttonText: 'Delete',
      buttonClassName: 'w-full h-14 bg-[#EB5757] hover:bg-[#EB5757]/95 text-white rounded-full font-bold text-base flex items-center justify-center active:scale-[0.99] transition-all cursor-pointer shadow-[0px_8px_20px_rgba(235,87,87,0.25)] border-0 outline-none',
      onAction: () => {
        navigate({ to: ROUTES.DASHBOARD })
      }
    })
  }

  const handleSaveGroupName = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tempGroupName.trim()) return
    setGroupName(tempGroupName.trim())
    setIsNamePanelOpen(false)
  }

  if (!contact || contact.type !== 'group') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#FEFAF1]">
        <p className="text-muted-foreground text-sm mb-4">Group not found</p>
        <button
          onClick={() => navigate({ to: ROUTES.DASHBOARD })}
          className="text-primary font-bold hover:underline border-0 bg-transparent cursor-pointer"
        >
          Go Back
        </button>
      </div>
    )
  }

  // Handle back navigation
  const handleBack = () => {
    navigate({ to: ROUTES.GROUP_DETAILS, params: { id: contact.id } })
  }

  // Derive group initials for fallback preview
  const groupInitials = groupName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-12 select-none text-left">
      {/* Page Header */}
      <FlowHeader
        title="Group Settings"
        onBack={handleBack}
        backVariant="circle"
      />

      <div className="px-6 flex flex-col gap-6 overflow-y-auto pb-8">
        {/* Profile Card Section */}
        <div className="flex flex-col items-center text-center mt-3">
          {/* Custom SVG Group Avatar / Uploaded Group Cover Photo */}
          <div className="w-24 h-24 rounded-full overflow-hidden bg-white shadow-sm border border-[#EFE7DD] flex items-center justify-center shrink-0 mb-4 relative">
            {groupPhoto ? (
              <img src={groupPhoto} alt="Group Cover" className="w-full h-full object-cover" />
            ) : (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Sky background */}
                <circle cx="50" cy="50" r="50" fill="#B2EBF2" />
                {/* Sun */}
                <circle cx="68" cy="30" r="8" fill="#FFF59D" />
                {/* Left Mountain (Medium Green) */}
                <path d="M18,80 L48,32 L68,80 Z" fill="#66BB6A" />
                {/* Right Mountain (Dark Green) */}
                <path d="M40,80 L65,42 L90,80 Z" fill="#388E3C" />
              </svg>
            )}
          </div>

          <h2 className="text-xl font-extrabold text-[#1A1A1A] leading-tight">
            {groupName}
          </h2>
          <p className="text-xs text-[#6B6B6B] font-bold mt-1">
            {members.length} members · Created by You
          </p>

          {/* Action Pills */}
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => setIsPhotoPanelOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#0B683A33] bg-[#E4F2EB] text-[#0B683A] text-xs font-bold transition-all hover:bg-[#E4F2EB]/80 shrink-0 cursor-pointer outline-none"
            >
              <Camera size={14} className="text-[#0B683A]" strokeWidth={2.5} />
              Photo
            </button>
            <button
              type="button"
              onClick={() => {
                setTempGroupName(groupName)
                setIsNamePanelOpen(true)
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#0B683A33] bg-[#E4F2EB] text-[#0B683A] text-xs font-bold transition-all hover:bg-[#E4F2EB]/80 shrink-0 cursor-pointer outline-none"
            >
              <Pencil size={14} className="text-[#0B683A]" strokeWidth={2.5} />
              Name
            </button>
          </div>
        </div>

        {/* Members Section */}
        <div className="flex flex-col text-left">
          <h3 className="text-[12px] font-bold text-[#6B6B6B] tracking-wider mb-2.5 px-1 uppercase">
            Members ({members.length})
          </h3>

          <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EFE7DD] overflow-hidden">
            {/* Render You (static, no options trigger) */}
            {members.find(m => m.id === 'you') && (
              <ContactListItem
                contact={{
                  id: 'you',
                  name: 'You',
                  initials: 'MH',
                  avatarColor: 'bg-[#0B683A] text-white',
                }}
                subtitle={
                  <span className="text-[#6B6B6B] text-[12px]">
                    Admin · Group creator
                  </span>
                }
                rightSlot={
                  <span className="bg-[#ECF6F0] text-[#0B683A] text-[11px] font-bold px-3 py-1 rounded-full">
                    Admin
                  </span>
                }
                className="py-4 px-5 bg-white hover:bg-transparent"
              />
            )}

            {/* Render Other Members */}
            {members.filter(m => m.id !== 'you').map((m) => (
              <ContactListItem
                key={m.id}
                contact={{
                  id: m.id,
                  name: m.name,
                  initials: m.initials,
                  avatarColor: m.avatarColor,
                }}
                subtitle={
                  <span className="text-[#6B6B6B] text-[12px]">
                    {m.owesText}
                  </span>
                }
                rightSlot={
                  <div className="flex items-center gap-2">
                    {m.isAdmin && (
                      <span className="bg-[#ECF6F0] text-[#0B683A] text-[11px] font-bold px-3 py-1 rounded-full">
                        Admin
                      </span>
                    )}
                    {m.isPending && (
                      <span className="bg-[#FFF3E0] text-[#C96A1B] text-[11px] font-bold px-3 py-1 rounded-full">
                        Pending
                      </span>
                    )}
                    {!m.isPending && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedMemberId(m.id)
                        }}
                        className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors p-1 cursor-pointer border-0 bg-transparent flex items-center justify-center"
                      >
                        <MoreVertical size={18} />
                      </button>
                    )}
                  </div>
                }
                onClick={() => !m.isPending && setSelectedMemberId(m.id)}
                className="py-4 px-5 bg-white hover:bg-muted/5 transition-colors"
              />
            ))}

            {/* Add Member Row */}
            <div
              role="button"
              tabIndex={0}
              className="flex items-center gap-3.5 p-5 transition-colors cursor-pointer bg-white hover:bg-muted/5"
            >
              {/* Plus icon inside dashed border green circle */}
              <div className="w-11 h-11 rounded-full border-2 border-dashed border-[#0B683A33] bg-[#E8F5E9]/30 flex items-center justify-center text-[#0B683A] shrink-0">
                <Plus size={20} strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-bold text-[14px] text-[#0B683A]">
                  Add Member
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Group Settings Section */}
        <div className="flex flex-col text-left">
          <h3 className="text-[12px] font-bold text-[#6B6B6B] tracking-wider mb-2.5 px-1 uppercase">
            Group Settings
          </h3>

          <div className="flex flex-col gap-4">
            {/* Smart Settle */}
            <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-5 flex items-start justify-between">
              <div className="flex-1 pr-4">
                <p className="font-bold text-[15px] text-[#1A1A1A]">
                  Smart Settle
                </p>
                <p className="text-[12px] text-[#6B6B6B] leading-relaxed mt-1">
                  Automatically simplifies group balances so members make fewer repayments.
                </p>
                <button
                  type="button"
                  onClick={() => navigate({ to: ROUTES.GROUP_SMART_SETTLE, params: { id: contact.id } })}
                  className="text-[12px] text-[#C96A1B] font-bold mt-1.5 block hover:underline border-0 bg-transparent cursor-pointer p-0 text-left outline-none"
                >
                  Learn More
                </button>
              </div>

              {/* Reactive Custom Switch Toggle */}
              <button
                type="button"
                onClick={() => setSmartSettleEnabled(!smartSettleEnabled)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none self-start mt-0.5",
                  smartSettleEnabled ? "bg-[#0B683A]" : "bg-[#D1D1D6]"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out",
                    smartSettleEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Recurring Payments */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: ROUTES.GROUP_RECURRING, params: { id: contact.id } })}
              className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-5 flex flex-col cursor-pointer hover:bg-muted/5 transition-colors outline-none"
            >
              <p className="font-bold text-[15px] text-[#1A1A1A]">
                Recurring payments
              </p>
              <p className="text-[12px] text-[#6B6B6B] leading-relaxed mt-1">
                Add recurring payments you want to split every month (Rent, subscriptions, bills) Add them once and stay on top automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone Section */}
        <div className="flex flex-col text-left">
          <h3 className="text-[12px] font-bold text-[#6B6B6B] tracking-wider mb-2.5 px-1 uppercase">
            Danger Zone
          </h3>

          <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EFE7DD] overflow-hidden">
            {/* Leave Group */}
            <div
              onClick={handleLeaveGroup}
              className="p-4 flex items-center gap-3.5 cursor-pointer hover:bg-[#FFF5F0]/20 active:scale-[0.99] transition-all"
            >
              <div className="w-12 h-12 rounded-[14px] bg-[#FFF5F0] flex items-center justify-center text-[#C96A1B] border border-[#C96A1B]/10 shrink-0">
                <LogOut size={20} strokeWidth={2.5} />
              </div>
              <p className="font-bold text-[15px] text-[#C96A1B]">
                Leave Group
              </p>
            </div>

            {/* Delete Group */}
            <div
              onClick={handleDeleteGroup}
              className="p-4 flex items-center gap-3.5 cursor-pointer hover:bg-[#FFF0F0]/20 active:scale-[0.99] transition-all"
            >
              <div className="w-12 h-12 rounded-[14px] bg-[#FFF0F0] flex items-center justify-center text-[#EB5757] border border-[#EB5757]/10 shrink-0">
                <Trash2 size={20} strokeWidth={2.5} />
              </div>
              <p className="font-bold text-[15px] text-[#EB5757]">
                Delete Group
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Reusable Option Drawer */}
      <MemberOptionsDrawer
        isOpen={selectedMemberId !== null}
        onClose={() => setSelectedMemberId(null)}
        member={selectedMember}
        onToggleAdmin={handleToggleAdmin}
        onRemove={handleRemoveMember}
        onBlockReport={handleBlockReport}
      />

      {/* Profile picture panel for group cover */}
      {isPhotoPanelOpen && (
        <ProfilePicturePanel
          title="Group Image"
          label="Current group photo"
          initials={groupInitials}
          currentAvatar={groupPhoto}
          onClose={() => setIsPhotoPanelOpen(false)}
          onSave={(newPhoto) => setGroupPhoto(newPhoto)}
        />
      )}

      {/* Outstanding Balance Drawer */}
      <OutstandingBalanceDrawer
        isOpen={drawerConfig.type === 'outstanding'}
        onClose={() => setDrawerConfig(prev => ({ ...prev, type: null }))}
        title={drawerConfig.title}
        warningText={drawerConfig.warningText || ''}
        buttonText={drawerConfig.buttonText}
        onAction={drawerConfig.onAction || (() => {})}
      />

      {/* Confirm Action Drawer */}
      <ConfirmActionDrawer
        isOpen={drawerConfig.type === 'confirm'}
        onClose={() => setDrawerConfig(prev => ({ ...prev, type: null }))}
        title={drawerConfig.title}
        confirmTitle={drawerConfig.confirmTitle || ''}
        confirmDescription={drawerConfig.confirmDescription || ''}
        buttonText={drawerConfig.buttonText}
        buttonClassName={drawerConfig.buttonClassName}
        onConfirm={drawerConfig.onAction || (() => {})}
      />

      {/* Edit Group Name Panel */}
      {isNamePanelOpen && (
        <div className="fixed inset-0 z-70 bg-[#FEFAF1] flex flex-col select-none overflow-y-auto animate-in fade-in slide-in-from-right duration-200 text-[#1A1A1A]">
          <FlowHeader
            title="Edit Group Name"
            onBack={() => setIsNamePanelOpen(false)}
          />

          <form onSubmit={handleSaveGroupName} className="flex-1 flex flex-col justify-between px-6 pb-8 pt-2">
            <div className="space-y-6">
              {/* Name Input */}
              <div className="space-y-1.5 text-left mt-4">
                <label className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase px-1">
                  Group Name
                </label>
                <div className="bg-white border-[0.8px] border-[#E8E4DC] focus-within:border-[#0B683A73] rounded-[16px] px-5 py-4 transition-all shadow-[0px_2px_10px_0px_rgba(0,0,0,0.05)]">
                  <input
                    type="text"
                    value={tempGroupName}
                    onChange={(e) => setTempGroupName(e.target.value)}
                    className="outline-none border-0 w-full text-[15px] font-medium text-[#1A1A1A] p-0 bg-transparent font-semibold"
                    required
                    placeholder="Enter group name"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div>
              <button
                type="submit"
                className="w-full h-14 bg-[#0B683A] text-white rounded-full font-bold text-base shadow-[0px_8px_20px_rgba(11,104,58,0.3)] active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
              >
                Save Name
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
