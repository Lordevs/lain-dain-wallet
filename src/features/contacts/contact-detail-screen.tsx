import { useMemo } from 'react'
import { useParams, useNavigate, Navigate } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import { useContactStore } from '@/store/use-contact-store'
import ContactAvatar from '@/components/shared/contact-avatar'
import { ROUTES } from '@/constants/routes'
import { formatPKR } from '@/lib/currency'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'
import ExpenseList, { type TransactionListItem } from '@/components/shared/expense-list'
import { useTransactionStore } from '@/store/use-transaction-store'


/**
 * ContactDetailScreen — manages individual contact ledger detail view.
 * Handles split-bill transactions, settlements, breakdowns, and reminders.
 */
export default function ContactDetailScreen() {
  const { id } = useParams({ from: '/contacts/$id/' })
  const navigate = useNavigate({ from: '/contacts/$id/' })

  // Find contact by id from store
  const contacts = useContactStore((state) => state.contacts)
  const contact = contacts.find((c) => c.id === id)

  const transactionState = useTransactionStore((state) => state.transactionsByContact)

  // Get grouped transaction history
  const transactions = useMemo(() => {
    const list = useTransactionStore.getState().getContactTransactions(id, contact?.name ?? '')
    const firstName = (contact?.name ?? '').split(' ')[0]

    const items: TransactionListItem[] = list.map((record) => {
      const displaySubtitle = record.category === 'payment' ? (
        <div className="flex flex-col text-left">
          <span className="text-[#6B6B6B] text-[12px] font-normal">You paid {firstName}</span>
          <span className="text-positive text-[12px] font-semibold">{record.subtitle}</span>
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
  }, [id, contact?.name, transactionState])

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
    ? 'text-positive'
    : isNegative
      ? 'text-[#C96A1B]'
      : 'text-[#1A1A1A]'

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
              onClick={() => navigate({
                to: ROUTES.CONTACT_REMINDER,
                params: { id: contact.id },
              })}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#0B683A4D] bg-[#E4F2EB] text-positive text-xs font-bold transition-all hover:bg-[#E4F2EB]/80 shrink-0 cursor-pointer outline-none"
            >
              <Bell size={13} className="text-positive" strokeWidth={2.5} />
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
                navigate({ to: ROUTES.TRANSACTION_DETAILS, params: { id: tid.toString() } })
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
                navigate({ to: ROUTES.TRANSACTION_DETAILS, params: { id: tid.toString() } })
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
                navigate({ to: ROUTES.TRANSACTION_DETAILS, params: { id: tid.toString() } })
              }}
            />
          </div>
        )}
      </div>

      {/* Sticky Bottom Row Buttons */}
      <div className="fixed bottom-3 left-3 right-3 z-10 flex items-center gap-4">
        {/* + Add Expense */}
        <button
          type="button"
          onClick={() => navigate({
            to: ROUTES.CONTACT_ADD_EXPENSE,
            params: { id: contact.id }
          })}
          className="flex-1 h-12 rounded-full bg-positive text-white font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
        >
          Add Expense
        </button>

        {/* Settle Up */}
        <button
          type="button"
          onClick={() => navigate({ to: ROUTES.SETTLE_UP, search: { contactId: contact.id } })}
          className="flex-1 h-12 rounded-full bg-[#FDB105] text-[#1A1A1A] font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
        >
          Settle Up
        </button>
      </div>
    </div>
  )
}
