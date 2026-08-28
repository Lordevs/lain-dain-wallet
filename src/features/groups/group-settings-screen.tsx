
import { useState } from 'react'
import { MoreVertical, Camera, Pencil, Plus, LogOut, Trash2, Banknote, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'
import ContactListItem from '@/components/shared/contact-list-item'
import MemberOptionsDrawer from '@/components/shared/member-options-drawer'
import OutstandingBalanceDrawer from '@/components/shared/outstanding-balance-drawer'
import ConfirmActionDrawer from '@/components/shared/confirm-action-drawer'
import AddGroupMemberDrawer from './components/add-group-member-drawer'
import GroupCurrencyRatesDrawer from './components/group-currency-rates-drawer'
import { ROUTES } from '@/constants/routes'
import { useGroupSettings } from './hooks/use-group-settings'

export default function GroupSettingsScreen() {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isCurrencyRatesOpen, setIsCurrencyRatesOpen] = useState(false)
  // A raw <img> below has no built-in fallback-on-load-error, so a
  // remote group photo that can't be fetched (offline, no network) left
  // a blank circle instead of the decorative fallback illustration.
  const [groupPhotoFailed, setGroupPhotoFailed] = useState(false)

  const {
    group,
    isLoading,
    isOwner,
    isAdmin,
    creatorName,
    smartSettleEnabled,
    setSmartSettleEnabled,
    isSmartSettlePending,
    groupPhoto,
    groupName,
    members,
    selectedMemberId,
    setSelectedMemberId,
    drawerConfig,
    setDrawerConfig,
    selectedMember,
    handleToggleAdmin,
    handleTransferOwnership,
    handleRemoveMember,
    handleBlockReport,
    handleLeaveGroup,
    handleDeleteGroup,
    navigate,
  } = useGroupSettings()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#FEFAF1]">
        <p className="text-muted-foreground text-sm">Loading group settings...</p>
      </div>
    )
  }

  if (!group) {
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

  const you = members.find((m) => m.id === 'you')

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-12 select-none text-left">
      {/* Page Header */}
      <FlowHeader
        title="Group Settings"
        backVariant="circle"
      />

      <div className="px-6 flex flex-col gap-6 overflow-y-auto pb-8">
        {/* Profile Card Section */}
        <div className="flex flex-col items-center text-center mt-3">
          {/* Custom SVG Group Avatar / Uploaded Group Cover Photo */}
          <div className="w-24 h-24 rounded-full overflow-hidden bg-white shadow-sm border border-[#EFE7DD] flex items-center justify-center shrink-0 mb-4 relative">
            {groupPhoto && !groupPhotoFailed ? (
              <img
                key={groupPhoto}
                src={groupPhoto}
                alt="Group Cover"
                className="w-full h-full object-cover"
                onError={() => setGroupPhotoFailed(true)}
              />
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
            {members.length} members · Created by {creatorName}
          </p>
          {group.description ? (
            <p className="text-xs text-[#6B6B6B] font-medium mt-1.5 max-w-65 text-center leading-relaxed">
              {group.description}
            </p>
          ) : null}

          {/* Action Pills */}
          {isAdmin && (
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => navigate({ to: ROUTES.GROUP_PHOTO, params: { id: group.id } })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#0B683A33] bg-[#E4F2EB] text-positive text-xs font-bold transition-all hover:bg-[#E4F2EB]/80 shrink-0 cursor-pointer outline-none"
              >
                <Camera size={14} className="text-positive" strokeWidth={2.5} />
                Photo
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: ROUTES.GROUP_NAME, params: { id: group.id } })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#0B683A33] bg-[#E4F2EB] text-positive text-xs font-bold transition-all hover:bg-[#E4F2EB]/80 shrink-0 cursor-pointer outline-none"
              >
                <Pencil size={14} className="text-positive" strokeWidth={2.5} />
                Name
              </button>
            </div>
          )}
        </div>

        {/* Members Section */}
        <div className="flex flex-col text-left">
          <h3 className="text-[12px] font-bold text-[#6B6B6B] tracking-wider mb-2.5 px-1 uppercase">
            Members ({members.length})
          </h3>

          <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EFE7DD] overflow-hidden">
            {/* Render You (static, no options trigger) */}
            {you && (
              <ContactListItem
                contact={{
                  id: 'you',
                  name: you.name,
                  initials: you.initials,
                  avatarColor: you.avatarColor,
                  src: you.avatar || undefined,
                }}
                subtitle={
                  <span className="text-[#6B6B6B] text-[12px]">
                    {you.role === 'member' ? 'Member' : 'Admin'}
                  </span>
                }
                rightSlot={
                  you.role !== 'member' ? (
                    <span className="bg-[#ECF6F0] text-positive text-[11px] font-bold px-3 py-1 rounded-full">
                      Admin
                    </span>
                  ) : null
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
                  src: m.avatar || undefined,
                }}
                subtitle={
                  <span className="text-[#6B6B6B] text-[12px]">
                    {m.role === 'member' ? 'Member' : 'Admin'}
                  </span>
                }
                rightSlot={
                  <div className="flex items-center gap-2">
                    {m.role !== 'member' && (
                      <span className="bg-[#ECF6F0] text-positive text-[11px] font-bold px-3 py-1 rounded-full">
                        Admin
                      </span>
                    )}
                    {isAdmin && (
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
                onClick={() => isAdmin && setSelectedMemberId(m.id)}
                className="py-4 px-5 bg-white hover:bg-muted/5 transition-colors"
              />
            ))}

            {/* Add Member Row */}
            {isAdmin && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsAddMemberOpen(true)}
                className="flex items-center gap-3.5 p-5 transition-colors cursor-pointer bg-white hover:bg-muted/5 outline-none"
              >
                {/* Plus icon inside dashed border green circle */}
                <div className="w-11 h-11 rounded-full border-2 border-dashed border-[#0B683A33] bg-[#E8F5E9]/30 flex items-center justify-center text-positive shrink-0">
                  <Plus size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-bold text-[14px] text-positive">
                    Add Member
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Smart Settle and Recurring Payments are open to any active admin
            (apps.expenses.services._require_recurring_manage_permission /
            apps.ledger.services.update_group both accept admin, not just
            owner). Currency & exchange rates stays owner-only — that's a
            separate service, set_group_currency_rate, which still calls
            _require_active_owner. */}
        {isAdmin && <div className="flex flex-col text-left">
          <h3 className="text-[12px] font-bold text-[#6B6B6B] tracking-wider mb-2.5 px-1 uppercase">
            Group Settings
          </h3>

          <div className="flex flex-col gap-4">
            {/* Group currency and exchange rates — owner-only */}
            {isOwner && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsCurrencyRatesOpen(true)}
                onKeyDown={(event) => event.key === 'Enter' && setIsCurrencyRatesOpen(true)}
                className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-5 flex items-center gap-4 cursor-pointer hover:bg-muted/5 transition-colors outline-none"
              >
                <div className="size-12 rounded-[15px] bg-[#E8F4EF] text-positive flex items-center justify-center shrink-0">
                  <Banknote size={21} strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[15px] text-[#1A1A1A]">
                      Currency & exchange rates
                    </p>
                    <span className="rounded-full bg-[#E8F4EF] px-2.5 py-1 text-[10px] font-extrabold text-positive">
                      {group.default_currency}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#6B6B6B] leading-relaxed mt-1">
                    {group.currency_rates.length === 0
                      ? 'No foreign currencies configured'
                      : `${group.currency_rates.length} ${group.currency_rates.length === 1 ? 'foreign currency' : 'foreign currencies'} configured`}
                  </p>
                </div>
                <ChevronRight size={18} className="text-[#8E8A86] shrink-0" />
              </div>
            )}

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
                  onClick={() => navigate({ to: ROUTES.GROUP_SMART_SETTLE, params: { id: group.id } })}
                  className="text-[12px] text-[#C96A1B] font-bold mt-1.5 block hover:underline border-0 bg-transparent cursor-pointer p-0 text-left outline-none"
                >
                  Learn More
                </button>
              </div>

              {/* Reactive Custom Switch Toggle */}
              <button
                type="button"
                disabled={isSmartSettlePending}
                onClick={() => setSmartSettleEnabled(!smartSettleEnabled)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none self-start mt-0.5",
                  isSmartSettlePending ? "cursor-wait opacity-70" : "cursor-pointer",
                  smartSettleEnabled ? "bg-positive" : "bg-[#D1D1D6]"
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
              onClick={() => navigate({ to: ROUTES.GROUP_RECURRING, params: { id: group.id } })}
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
        </div>}

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

            {/* Delete Group — only the owner can dissolve the group. */}
            {isOwner && <div
              onClick={handleDeleteGroup}
              className="p-4 flex items-center gap-3.5 cursor-pointer hover:bg-[#FFF0F0]/20 active:scale-[0.99] transition-all"
            >
              <div className="w-12 h-12 rounded-[14px] bg-[#FFF0F0] flex items-center justify-center text-[#EB5757] border border-[#EB5757]/10 shrink-0">
                <Trash2 size={20} strokeWidth={2.5} />
              </div>
              <p className="font-bold text-[15px] text-[#EB5757]">
                Delete Group
              </p>
            </div>}
          </div>
        </div>
      </div>

      {/* Dynamic Reusable Option Drawer */}
      <MemberOptionsDrawer
        isOpen={selectedMemberId !== null}
        onClose={() => setSelectedMemberId(null)}
        member={selectedMember}
        isCurrentUserOwner={isOwner}
        onToggleAdmin={handleToggleAdmin}
        onTransferOwnership={handleTransferOwnership}
        onRemove={handleRemoveMember}
        onBlockReport={handleBlockReport}
      />


      {/* Outstanding Balance Drawer */}
      <OutstandingBalanceDrawer
        isOpen={drawerConfig.type === 'outstanding'}
        onClose={() => setDrawerConfig((prev) => ({ ...prev, type: null }))}
        title={drawerConfig.title}
        warningText={drawerConfig.warningText || ''}
        buttonText={drawerConfig.buttonText}
        onAction={drawerConfig.onAction || (() => { })}
      />

      {/* Confirm Action Drawer */}
      <ConfirmActionDrawer
        isOpen={drawerConfig.type === 'confirm'}
        onClose={() => setDrawerConfig(prev => ({ ...prev, type: null }))}
        title={drawerConfig.title}
        confirmTitle={drawerConfig.confirmTitle || ''}
        confirmDescription={drawerConfig.confirmDescription || ''}
        buttonText={drawerConfig.buttonText}
        variant={drawerConfig.buttonVariant}
        onConfirm={drawerConfig.onAction || (() => { })}
      />

      {/* Add Member Drawer */}
      <AddGroupMemberDrawer
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        groupId={group.id}
        groupCurrency={group.default_currency}
        currencyRates={group.currency_rates}
        existingMemberUserIds={group.members.map((m) => m.id)}
      />

      <GroupCurrencyRatesDrawer
        isOpen={isCurrencyRatesOpen}
        onClose={() => setIsCurrencyRatesOpen(false)}
        group={group}
        canManage={isAdmin}
      />
    </div>
  )
}
