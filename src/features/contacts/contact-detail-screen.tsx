import { useMemo } from 'react'
import { useParams, useNavigate, Navigate, useSearch } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import { MOCK_RECEIVABLES, MOCK_PAYABLES } from '@/features/dashboard/data/mock-data'
import ContactAvatar from '@/components/shared/contact-avatar'
import { ROUTES } from '@/constants/routes'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'
import ExpenseList, { type ExpenseListData } from '@/components/shared/expense-list'
import { type ExpenseCategory } from '@/components/shared/expense-item'
import { getContactTransactions } from '@/features/contacts/data/transaction-store'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import SendReminderScreen from '@/features/contacts/send-reminder-screen'
import LedgerBreakdownScreen from '@/features/contacts/ledger-breakdown-screen'
import AddContactExpenseScreen from '@/features/contacts/add-contact-expense-screen'
import EditContactExpenseScreen from '@/features/contacts/edit-contact-expense-screen'
import TransactionDetailScreen from '@/features/transactions/transaction-detail-screen'


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

// Helper mock data generator for transactions grouped by date sections
const GET_TRANSACTIONS = (contactId: string, contactName: string): {
  Today: TransactionItem[]
  Yesterday: TransactionItem[]
  Earlier: TransactionItem[]
} => {
  const list = getContactTransactions(contactId, contactName)
  const firstName = contactName.split(' ')[0]

  const items: TransactionItem[] = list.map((record) => {
    const displaySubtitle = record.category === 'payment' ? (
      <div className="flex flex-col text-left">
        <span className="text-primary font-bold text-[12px]">You paid {firstName}</span>
        <span className="text-[10px] text-[#9A9590] mt-0.5 font-normal">Balance adjusted</span>
      </div>
    ) : record.subtitle

    return {
      ...record,
      subtitle: displaySubtitle
    }
  })

  const today: TransactionItem[] = []
  const yesterday: TransactionItem[] = []
  const earlier: TransactionItem[] = []

  items.forEach((item) => {
    const sub = item.rightSubtitle.toLowerCase()
    if (sub.includes('today') || sub.includes('pm') || sub.includes('am')) {
      today.push(item)
    } else if (sub.includes('yesterday')) {
      yesterday.push(item)
    } else {
      earlier.push(item)
    }
  })

  return {
    Today: today,
    Yesterday: yesterday,
    Earlier: earlier,
  }
}

/**
 * ContactDetailScreen — displays detailed breakdown of ledgers for a selected contact.
 * Includes back button, avatar, overall stat card, timeline-grouped transactions list, and bottom actions.
 */
export default function ContactDetailScreen() {
  const { id } = useParams({ from: '/contacts/$id/' })
  const navigate = useNavigate({ from: '/contacts/$id/' })
  const { drawer, txId } = useSearch({ from: '/contacts/$id/' })

  const closeDrawer = () => {
    navigate({
      search: (prev) => {
        const next = { ...prev }
        delete next.drawer
        delete next.txId
        return next
      },
    })
  }

  const openDrawer = (name: 'reminder' | 'breakdown' | 'add-expense' | 'edit-expense' | 'transaction', tid?: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        drawer: name,
        txId: tid,
      }),
    })
  }

  // Find contact by id from mock data
  const contact = [...MOCK_RECEIVABLES, ...MOCK_PAYABLES].find((c) => c.id === id)

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
  let formattedVal = formatCurrency(absAmount, 'PKR')
  formattedVal = formattedVal.replace('₨', 'Rs.').replace('Rs. ', 'Rs.')

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

  // Get grouped transaction history
  const transactions = useMemo(() => GET_TRANSACTIONS(id, contact.name), [id, contact.name])

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-24 relative select-none">
      {/* Unified Header */}
      <FlowHeader
        title={contact.name}
        subtitle="Personal Balance"
        onBack={() => navigate({ to: ROUTES.DASHBOARD })}
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
      <div className="fixed bottom-0 left-0 right-0 z-10 px-6 py-4 bg-[#FEFAF1]/90 flex items-center gap-4">
        {/* + Add Expense */}
        <button
          type="button"
          onClick={() => openDrawer('add-expense')}
          className="flex-1 h-14 rounded-full bg-[#0B683A] text-white font-extrabold text-base cursor-pointer shadow-[0px_6.29px_20.13px_0px_#0B683A4D] hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
        >
          + Add Expense
        </button>

        {/* Record Payment */}
        <button
          type="button"
          onClick={() => console.log('Record Payment Clicked')}
          className="flex-1 h-14 rounded-full bg-[#FDB105] text-[#1A1A1A] font-extrabold text-base cursor-pointer shadow-[0px_6.29px_20.13px_0px_#FDB1054D] hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
        >
          Record Payment
        </button>
      </div>

      <Drawer open={drawer === 'reminder'} onOpenChange={(open) => !open && closeDrawer()}>
        <DrawerContent className="bg-white rounded-t-[32px] border-t-0 p-0 flex flex-col focus:outline-none overflow-hidden text-[#1A1A1A] h-[85vh] max-h-[85vh]">
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
        <DrawerContent className="bg-white rounded-t-[32px] border-t-0 p-0 flex flex-col focus:outline-none overflow-hidden text-[#1A1A1A] h-[95vh] max-h-[95vh]">
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
        <DrawerContent className="bg-white rounded-t-[32px] border-t-0 p-0 flex flex-col focus:outline-none overflow-hidden text-[#1A1A1A] h-[95vh] max-h-[95vh]">
          {drawer === 'edit-expense' && txId && (
            <EditContactExpenseScreen
              contactId={contact.id}
              txId={txId}
              onClose={closeDrawer}
              onSuccess={() => openDrawer('transaction', txId)}
            />
          )}
        </DrawerContent>
      </Drawer>

      <Drawer open={drawer === 'transaction'} onOpenChange={(open) => !open && closeDrawer()}>
        <DrawerContent className="bg-white rounded-t-[32px] border-t-0 p-0 flex flex-col focus:outline-none overflow-hidden text-[#1A1A1A] h-[90vh] max-h-[90vh]">
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
