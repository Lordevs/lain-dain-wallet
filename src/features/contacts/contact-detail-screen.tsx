import { useMemo, useState } from 'react'
import { useParams, useNavigate, Navigate, useSearch } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import { useContactStore } from '@/store/use-contact-store'
import ContactAvatar from '@/components/shared/contact-avatar'
import { ROUTES } from '@/constants/routes'
import { formatPKR } from '@/lib/currency'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'
import ExpenseList, { type ExpenseListData } from '@/components/shared/expense-list'
import { type ExpenseCategory } from '@/components/shared/expense-item'
import { useTransactionStore } from '@/store/use-transaction-store'
import { Drawer, DrawerContent, FULLSCREEN_DRAWER_CN } from '@/components/ui/drawer'
import SendReminderScreen from '@/features/contacts/send-reminder-screen'
import LedgerBreakdownScreen from '@/features/contacts/ledger-breakdown-screen'
import AddContactExpenseScreen from '@/features/contacts/add-contact-expense-screen'
import EditContactExpenseScreen from '@/features/contacts/edit-contact-expense-screen'
import TransactionDetailScreen from '@/features/transactions/transaction-detail-screen'
import SettleUpPanel from '@/features/notifications/components/settle-up-panel'


interface TransactionItem extends ExpenseListData {
  id: string
  name: string
  subtitle: React.ReactNode
  amount: number
  category: ExpenseCategory
  rightSubtitle: string
  showChevron?: boolean
  className?: string
}

/**
 * ContactDetailScreen — manages individual contact ledger detail view.
 * Handles split-bill transactions, settlements, breakdowns, and reminders.
 */
export default function ContactDetailScreen() {
  const { id } = useParams({ from: '/contacts/$id/' })
  const navigate = useNavigate({ from: '/contacts/$id/' })
  const { drawer, txId } = useSearch({ from: '/contacts/$id/' })
  const [showSettleUp, setShowSettleUp] = useState(false)

  const openDrawer = (dName: 'breakdown' | 'reminder' | 'transaction' | 'add-expense' | 'edit-expense', tid?: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        drawer: dName,
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

  // Find contact by id from store
  const contacts = useContactStore((state) => state.contacts)
  const contact = contacts.find((c) => c.id === id)

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#FEFAF1]">
        <p className="text-muted-foreground text-sm mb-4">Contact not found</p>
        <button
          onClick={() => navigate({ to: ROUTES.DASHBOARD })}
          className="text-primary font-bold hover:underline border-0 bg-transparent cursor-pointer"
        >
          Go Back
        </button>
      </div>
    )
  }

  if (contact.type === 'group') {
    return <Navigate to={ROUTES.GROUP_DETAILS} params={{ id: contact.id }} replace />
  }

  // Resolve the "Personal Balance"
  const personalTag = contact.tags.find(
    (t) => t.name.toLowerCase().includes('1-to-1') || t.name.toLowerCase().includes('personal')
  )
  const personalAmount = personalTag ? personalTag.amount : contact.netAmount

  const isPositive = personalAmount > 0
  const isNegative = personalAmount < 0
  const absAmount = Math.abs(personalAmount)
  const formattedVal = formatPKR(absAmount)

  const statusLabel = isPositive
    ? 'You will receive'
    : isNegative
      ? 'You owe'
      : 'Settle up'

  const amountColorClass = isPositive
    ? 'text-[#0B683A]'
    : isNegative
      ? 'text-[#C96A1B]'
      : 'text-[#1A1A1A]'

  const transactionState = useTransactionStore((state) => state.transactionsByContact)

  // Get grouped transaction history
  const transactions = useMemo(() => {
    const list = useTransactionStore.getState().getContactTransactions(id, contact.name)
    const firstName = contact.name.split(' ')[0]

    const items: TransactionItem[] = list.map((record) => {
      const displaySubtitle = record.category === 'payment' ? (
        <div className="flex flex-col text-left">
          <span className="text-[#6B6B6B] text-[12px] font-normal">You paid {firstName}</span>
          <span className="text-[#0B683A] text-[12px] font-semibold">{record.subtitle}</span>
        </div>
      ) : record.subtitle

      return {
        id: record.id,
        name: record.name,
        subtitle: displaySubtitle,
        amount: Math.abs(record.amount),
        category: record.category as any,
        rightSubtitle: record.rightSubtitle,
        showChevron: record.showChevron,
        className: record.className,
        amountColor: record.amount > 0 ? 'green' : record.amount < 0 ? 'orange' : 'black',
      }
    })

    return {
      Today: items.filter((item) => item.rightSubtitle.toLowerCase().includes('today') || item.rightSubtitle.toLowerCase().includes('pm') || item.rightSubtitle.toLowerCase().includes('am')),
      Yesterday: items.filter((item) => item.rightSubtitle.toLowerCase().includes('yesterday')),
      Earlier: items.filter(
        (item) =>
          !item.rightSubtitle.toLowerCase().includes('today') &&
          !item.rightSubtitle.toLowerCase().includes('pm') &&
          !item.rightSubtitle.toLowerCase().includes('am') &&
          !item.rightSubtitle.toLowerCase().includes('yesterday')
      ),
    }
  }, [id, contact.name, transactionState])

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-24 relative select-none">
      {/* Unified Header */}
      <FlowHeader
        title={contact.name}
        subtitle="Personal Balance"
        backVariant="minimal"
        avatar={
          <div className="relative shrink-0 flex items-center">
            <ContactAvatar
              initials={contact.initials}
              avatarColor={contact.avatarColor}
              size="md"
              className="size-11 text-sm font-bold"
            />
            {contact.isOnline && (
              <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#14A558] border border-[#FEFAF1] rounded-full" />
            )}
          </div>
        }
        rightSlot={undefined}
      />

      {/* Overall Balance Stat Card */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex items-center justify-between">
          <div className="flex flex-col text-left">
            <span className="text-[#6B6B6B] text-[13px] font-semibold">
              {statusLabel}
            </span>
            <span className={cn('text-3xl font-extrabold mt-2 leading-none tracking-tight', amountColorClass)}>
              {formattedVal}
            </span>
          </div>
          {isPositive && (
            <button
              type="button"
              onClick={() => openDrawer('reminder')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#0B683A4D] bg-[#E4F2EB] text-[#0B683A] text-xs font-bold transition-all hover:bg-[#E4F2EB]/80 shrink-0 cursor-pointer outline-none"
            >
              <Bell size={13} className="text-[#0B683A]" strokeWidth={2.5} />
              Remind
            </button>
          )}
        </div>
      </div>

      {/* Timeline Sections Container */}
      <div className="flex flex-col gap-5 px-6 pb-12 overflow-y-auto">
        {/* Empty State */}
        {transactions.Today.length === 0 &&
          transactions.Yesterday.length === 0 &&
          transactions.Earlier.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center select-none bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)]">
              <p className="text-muted-foreground text-sm font-semibold">No transactions yet</p>
              <p className="text-xs text-[#9A9590] mt-1 font-medium">Add an expense to start the ledger history</p>
            </div>
          )}

        {/* Today Group */}
        {transactions.Today.length > 0 && (
          <div className="flex flex-col text-left">
            <h3 className="text-sm font-bold text-[#6B6B6B] mb-2">Today</h3>
            <ExpenseList
              expenses={transactions.Today}
              onItemClick={(tid) => {
                openDrawer('transaction', tid.toString())
              }}
            />
          </div>
        )}

        {/* Yesterday Group */}
        {transactions.Yesterday.length > 0 && (
          <div className="flex flex-col text-left">
            <h3 className="text-sm font-bold text-[#6B6B6B] mb-2">Yesterday</h3>
            <ExpenseList
              expenses={transactions.Yesterday}
              onItemClick={(tid) => {
                openDrawer('transaction', tid.toString())
              }}
            />
          </div>
        )}

        {/* Earlier Group */}
        {transactions.Earlier.length > 0 && (
          <div className="flex flex-col text-left">
            <h3 className="text-sm font-bold text-[#6B6B6B] mb-2">Earlier</h3>
            <ExpenseList
              expenses={transactions.Earlier}
              onItemClick={(tid) => {
                openDrawer('transaction', tid.toString())
              }}
            />
          </div>
        )}
      </div>

      {/* Sticky Bottom Row Buttons */}
      <div className="fixed bottom-0 left-0 right-0 z-10 px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-[#FEFAF1]/90 flex items-center gap-4">
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
          mode="contact"
          notification={{
            id: 'contact-settle',
            tag: 'Payment requested',
            title: `${contact.name} requested Rs. ${Math.abs(personalAmount)}`,
            subtitle: contact.name,
            time: 'Just now',
            type: 'request',
            section: 'action_needed',
            theme: 'green'
          }}
          onClose={() => setShowSettleUp(false)}
          onConfirm={() => {
            setShowSettleUp(false)
            console.log('Contact Settle Up Confirmed!')
          }}
        />
      )}

      <Drawer open={drawer === 'reminder'} onOpenChange={(open) => !open && closeDrawer()}>
        <DrawerContent className={FULLSCREEN_DRAWER_CN}>
          {drawer === 'reminder' && (
            <SendReminderScreen contactId={contact.id} onClose={closeDrawer} />
          )}
        </DrawerContent>
      </Drawer>

      <Drawer direction="right" open={drawer === 'breakdown'} onOpenChange={(open) => !open && closeDrawer()}>
        <DrawerContent className="bg-white p-0 flex flex-col focus:outline-none overflow-hidden text-[#1A1A1A] data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:max-w-full data-[vaul-drawer-direction=right]:rounded-none data-[vaul-drawer-direction=right]:border-0 data-[vaul-drawer-direction=right]:h-full">
          {drawer === 'breakdown' && (
            <LedgerBreakdownScreen contactId={contact.id} onClose={closeDrawer} />
          )}
        </DrawerContent>
      </Drawer>

      <Drawer open={drawer === 'add-expense'} onOpenChange={(open) => !open && closeDrawer()}>
        <DrawerContent className={FULLSCREEN_DRAWER_CN}>
          {drawer === 'add-expense' && (
            <AddContactExpenseScreen
              contactId={contact.id}
              onClose={closeDrawer}
              onSuccess={(newId) => openDrawer('transaction', newId)}
            />
          )}
        </DrawerContent>
      </Drawer>

      <Drawer open={drawer === 'edit-expense'} onOpenChange={(open) => !open && closeDrawer()}>
        <DrawerContent className={FULLSCREEN_DRAWER_CN}>
          {drawer === 'edit-expense' && txId && (
            <EditContactExpenseScreen
              contactId={contact.id}
              txId={txId}
              onClose={() => openDrawer('transaction', txId)}
              onSuccess={closeDrawer}
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
              onEdit={() => openDrawer('edit-expense', txId)}
              onDelete={closeDrawer}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}
