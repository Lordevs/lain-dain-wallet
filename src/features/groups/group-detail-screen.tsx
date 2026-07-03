import { useState } from 'react'
import { useParams, useNavigate, useSearch } from '@tanstack/react-router'
import { MoreVertical, ChevronRight } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { formatPKR } from '@/lib/currency'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'
import ContactList from '@/components/shared/contact-list'
import ContactListItem from '@/components/shared/contact-list-item'
import SettleUpPanel from '@/features/notifications/components/settle-up-panel'
import { Drawer, DrawerContent, FULLSCREEN_DRAWER_CN } from '@/components/ui/drawer'
import SendGroupReminderScreen from '@/features/groups/send-group-reminder-screen'
import AddGroupExpenseScreen from '@/features/groups/add-group-expense-screen'
import EditGroupExpenseScreen from '@/features/groups/edit-group-expense-screen'
import TransactionDetailScreen from '@/features/transactions/transaction-detail-screen'
import { useGroupLedger, getCategoryDetails } from '@/features/groups/hooks/use-group-ledger'
import GroupBalanceCarousel from '@/features/groups/components/group-balance-carousel'
import GroupCategoryExpenses from '@/features/groups/components/group-category-expenses'

/**
 * GroupDetailScreen — handles detailed views and features for groups.
 */
export default function GroupDetailScreen() {
  const { id } = useParams({ from: '/groups/$id/' })
  const navigate = useNavigate({ from: '/groups/$id/' })
  const { drawer, txId } = useSearch({ from: '/groups/$id/' })

  const openDrawer = (name: 'reminder' | 'add-expense' | 'edit-expense' | 'transaction', tid?: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        drawer: name,
        txId: tid,
      }),
      replace: true,
    })
  }

  const closeDrawer = () => {
    navigate({
      search: (prev) => {
        const next = { ...prev }
        delete next.drawer
        delete next.txId
        return next
      },
      replace: true,
    })
  }

  // State to filter by category
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // State to trigger Settle Up Drawer
  const [showSettleUp, setShowSettleUp] = useState(false)

  const { contact, groupExpensesData, categoriesSummary, groupBalances } = useGroupLedger(id)

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

  const catDetails = selectedCategory ? getCategoryDetails(selectedCategory) : null
  const filteredExpenses = selectedCategory ? groupExpensesData.filter((exp) => (exp.category || 'other') === selectedCategory) : []
  const totalSpent = filteredExpenses.reduce((sum, exp) => sum + Math.abs(exp.amount), 0)
  const formattedTotal = formatPKR(totalSpent)

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-24 relative select-none">
      {selectedCategory && catDetails ? (
        <GroupCategoryExpenses
          label={catDetails.label}
          color={catDetails.color}
          Icon={catDetails.icon}
          formattedTotal={formattedTotal}
          expenses={filteredExpenses}
          onBack={() => setSelectedCategory(null)}
          onExpenseClick={(expenseId) => openDrawer('transaction', expenseId.toString())}
        />
      ) : (
        <>
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
            onRemind={() => openDrawer('reminder')}
          />

          {/* Scrollable breakdown container */}
          <div className="flex-1 overflow-y-auto px-6 pb-12 flex flex-col gap-6">

            {/* Balances Section */}
            <div className="flex flex-col text-left">
              <div className="flex items-center justify-between mb-3 mt-1">
                <h3 className="text-sm font-bold text-[#1A1A1A]">Balances</h3>
                <button className="flex items-center gap-1 text-[13px] font-bold text-[#0B683A] bg-transparent border-0 cursor-pointer outline-none">
                  View all <ChevronRight size={14} className="rotate-90 text-[#0B683A]" strokeWidth={2.5} />
                </button>
              </div>

              <ContactList>
                {groupBalances.map((mb) => (
                  <ContactListItem
                    key={mb.id}
                    onClick={() => {
                      const targetId = mb.name === 'Ali Hassan'
                        ? '1'
                        : mb.name === 'Sara Khan'
                          ? '2'
                          : '1' // Fallback to Ali Hassan (existing mock data)
                      navigate({
                        to: ROUTES.CONTACT_DETAILS,
                        params: { id: targetId }
                      })
                    }}
                    contact={{
                      id: mb.id,
                      name: mb.name,
                      initials: mb.initials,
                      avatarColor: mb.avatarColor,
                    }}
                    subtitle={
                      <span className={cn(
                        "font-bold text-[12px] leading-tight",
                        mb.direction === 'in' ? 'text-[#0B683A]' : 'text-[#C96A1B]'
                      )}>
                        {mb.subtitle}
                      </span>
                    }
                    rightSlot={
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {mb.direction === 'in' ? (
                            <span className="text-[#0B683A] font-extrabold text-[15px]">↓</span>
                          ) : (
                            <span className="text-[#C96A1B] font-extrabold text-[15px]">↑</span>
                          )}
                          <span className={cn(
                            "text-[15px] font-extrabold",
                            mb.direction === 'in' ? 'text-[#0B683A]' : 'text-[#C96A1B]'
                          )}>
                            Rs. {new Intl.NumberFormat('en-US').format(mb.amount)}
                          </span>
                        </div>
                        <ChevronRight size={14} className="text-[#9A9590]" strokeWidth={2.5} />
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
                      onClick={() => setSelectedCategory(summary.id)}
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
                          <span className="font-bold text-[15px] text-[#1A1A1A]">
                            {summary.label}
                          </span>
                          <span className="text-[12px] text-[#6B6B6B] font-medium mt-0.5">
                            {summary.count} {summary.count === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[15px] text-[#1A1A1A]">
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
          <div className="fixed bottom-0 left-0 right-0 z-10 px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-[#FEFAF1]/90 flex items-center gap-4 border-t border-[#EFE7DD]/30 backdrop-blur-sm">
            {/* + Add Expense */}
            <button
              type="button"
              onClick={() => openDrawer('add-expense')}
              className="flex-1 h-12 rounded-full bg-[#0B683A] text-white font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
            >
              Add Expense
            </button>

            {/* Settle Up */}
            <button
              type="button"
              onClick={() => setShowSettleUp(true)}
              className="flex-1 h-12 rounded-full bg-[#FDB105] text-[#1A1A1A] font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
            >
              Settle Up
            </button>
          </div>

          {/* Settle Up sliding drawer flow */}
          {showSettleUp && (
            <SettleUpPanel
              notification={{
                id: 'group-settle',
                tag: 'Payment requested',
                title: `${contact.name} requested Rs. ${contact.netAmount}`,
                subtitle: contact.name,
                time: 'Just now',
                type: 'request',
                section: 'action_needed',
                theme: 'green'
              }}
              onClose={() => setShowSettleUp(false)}
              onConfirm={() => {
                setShowSettleUp(false)
              }}
            />
          )}

        </>
      )}

      <Drawer open={drawer === 'reminder'} onOpenChange={(open) => !open && closeDrawer()}>
        <DrawerContent className={FULLSCREEN_DRAWER_CN}>
          {drawer === 'reminder' && (
            <SendGroupReminderScreen groupId={contact.id} onClose={closeDrawer} />
          )}
        </DrawerContent>
      </Drawer>

      <Drawer open={drawer === 'add-expense'} onOpenChange={(open) => !open && closeDrawer()}>
        <DrawerContent className={FULLSCREEN_DRAWER_CN}>
          {drawer === 'add-expense' && (
            <AddGroupExpenseScreen
              groupId={contact.id}
              onClose={closeDrawer}
              onSuccess={(newId) => openDrawer('transaction', newId)}
            />
          )}
        </DrawerContent>
      </Drawer>

      <Drawer open={drawer === 'transaction'} onOpenChange={(open) => !open && closeDrawer()}>
        <DrawerContent className={FULLSCREEN_DRAWER_CN}>
          {drawer === 'transaction' && txId && (
            <TransactionDetailScreen
              txId={txId}
              onClose={closeDrawer}
              onDelete={closeDrawer}
              onEdit={() => openDrawer('edit-expense', txId)}
            />
          )}
        </DrawerContent>
      </Drawer>

      <Drawer open={drawer === 'edit-expense'} onOpenChange={(open) => !open && closeDrawer()}>
        <DrawerContent className={FULLSCREEN_DRAWER_CN}>
          {drawer === 'edit-expense' && txId && (
            <EditGroupExpenseScreen
              groupId={contact.id}
              txId={txId}
              onClose={() => openDrawer('transaction', txId)}
              onSuccess={closeDrawer}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}
