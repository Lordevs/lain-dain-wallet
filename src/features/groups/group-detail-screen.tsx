
import { useParams, useNavigate } from '@tanstack/react-router'
import { MoreVertical, ChevronRight } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { formatPKR } from '@/lib/currency'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'
import ContactList from '@/components/shared/contact-list'
import ContactListItem from '@/components/shared/contact-list-item'
import { useGroupLedger } from '@/features/groups/hooks/use-group-ledger'
import GroupBalanceCarousel from '@/features/groups/components/group-balance-carousel'

/**
 * GroupDetailScreen — handles detailed views and features for groups.
 */
export default function GroupDetailScreen() {
  const { id } = useParams({ from: '/groups/$id/' })
  const navigate = useNavigate({ from: '/groups/$id/' })

  const { contact, categoriesSummary, groupBalances } = useGroupLedger(id)

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

  const isGroupReceivable = contact.netAmount > 0
  const formattedGroupVal = formatPKR(Math.abs(contact.netAmount))

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-24 relative select-none">
      {/* Unified Header */}
          <FlowHeader
            title={contact.name}
            subtitle={`${contact.ledgerCount} members`}
            backVariant="minimal"
            avatar={
              <div className={cn("w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 border border-[#EFE7DD] shadow-[0px_2px_8px_rgba(0,0,0,0.02)]", contact.avatarColor)}>
                {contact.initials}
              </div>
            }
            rightSlot={
              <button
                type="button"
                onClick={() => navigate({ to: ROUTES.GROUP_SETTINGS, params: { id: contact.id } })}
                className="text-[#6B6B6B] cursor-pointer border-0 bg-transparent flex items-center justify-center p-2"
              >
                <MoreVertical size={20} />
              </button>
            }
          />

          <GroupBalanceCarousel
            isReceivable={isGroupReceivable}
            formattedNetAmount={formattedGroupVal}
            onRemind={() => navigate({ to: ROUTES.GROUP_REMINDER, params: { id: contact.id } })}
          />

          {/* Scrollable breakdown container */}
          <div className="flex-1 overflow-y-auto px-6 pb-12 flex flex-col gap-6">

            {/* Balances Section */}
            <div className="flex flex-col text-left">
              <div className="flex items-center justify-between mb-3 mt-1">
                <h3 className="text-sm font-bold text-[#1A1A1A]">Balances</h3>
                <button className="flex items-center gap-1 text-[13px] font-bold text-positive bg-transparent border-0 cursor-pointer outline-none">
                  View all <ChevronRight size={14} className="rotate-90 text-positive" strokeWidth={2.5} />
                </button>
              </div>

              <ContactList>
                {groupBalances.map((mb) => (
                  <ContactListItem
                    key={mb.id}
                    contact={{
                      id: mb.id,
                      name: mb.name,
                      initials: mb.initials,
                      avatarColor: mb.avatarColor,
                    }}
                    subtitle={
                      <span className={cn(
                        mb.direction === 'in' ? 'text-positive' : 'text-[#C96A1B]'
                      )}>
                        {mb.subtitle}
                      </span>
                    }
                    rightSlot={
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {mb.direction === 'in' ? (
                            <span className="text-positive font-semibold text-[13px]">↓</span>
                          ) : (
                            <span className="text-[#C96A1B] font-semibold text-[13px]">↑</span>
                          )}
                          <span className={cn(
                            "text-[13px] font-black",
                            mb.direction === 'in' ? 'text-positive' : 'text-[#C96A1B]'
                          )}>
                            Rs. {new Intl.NumberFormat('en-US').format(mb.amount)}
                          </span>
                        </div>
                      </div>
                    }
                    className="p-4 hover:bg-muted/5 transition-all bg-white"
                  />
                ))}
              </ContactList>
            </div>

            {/* Expenses Section */}
            <div className="flex flex-col text-left">
              <div className="flex items-center justify-between mb-3 mt-1">
                <h3 className="text-sm font-bold text-[#1A1A1A]">
                  Expenses <span className="text-[#6B6B6B] font-medium">({categoriesSummary.length} categories)</span>
                </h3>
              </div>

              <div className="bg-white border border-[#EFE7DD] rounded-xl divide-y! divide-[#EFE7DD]! overflow-hidden shadow-[0px_4px_16px_rgba(0,0,0,0.02)]">
                {categoriesSummary.map((summary) => {
                  const IconComp = summary.icon
                  const formattedVal = formatPKR(summary.total)
                  return (
                    <button
                      key={summary.id}
                      type="button"
                      onClick={() => navigate({ to: ROUTES.GROUP_CATEGORY, params: { id: contact.id, catId: summary.id } })}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/5 transition-colors border-0 outline-none text-left cursor-pointer bg-white"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${summary.color}15` }}
                        >
                          <IconComp size={20} style={{ color: summary.color }} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-sm text-[#1A1A1A]">
                            {summary.label}
                          </span>
                          <span className="text-xs text-[#6B6B6B] font-normal mt-0.5">
                            {summary.count} {summary.count === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1A1A1A]">
                          {formattedVal}
                        </span>
                        <ChevronRight size={16} className="text-[#9A9590]" strokeWidth={2.5} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>

          {/* Sticky Bottom Row Buttons */}
          <div className="fixed bottom-3 left-3 right-3 z-10 flex items-center gap-4">
            {/* Add Expense */}
            <button
              type="button"
              onClick={() => navigate({ to: ROUTES.GROUP_ADD_EXPENSE, params: { id: contact.id } })}
              className="flex-1 h-12 rounded-full bg-[#1A1A1A] text-white font-extrabold text-base cursor-pointer hover:bg-neutral-800 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
            >
              Add Expense
            </button>

            {/* Settle Up */}
            <button
              type="button"
              onClick={() => navigate({ to: ROUTES.SETTLE_UP, search: { groupId: contact.id } })}
              className="flex-1 h-12 rounded-full bg-[#FDB105] text-[#1A1A1A] font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
            >
              Settle Up
            </button>
          </div>
    </div>
  )
}
