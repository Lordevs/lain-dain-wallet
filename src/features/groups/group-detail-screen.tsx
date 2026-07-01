import { useMemo, useState } from 'react'
import { useParams, useNavigate, useSearch } from '@tanstack/react-router'
import { MoreVertical, Bell, ChevronRight, Building2, Handshake, HelpCircle, ArrowUp, ArrowDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MOCK_RECEIVABLES, MOCK_PAYABLES } from '@/features/dashboard/data/mock-data'
import { ROUTES } from '@/constants/routes'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'
import ExpenseList, { type ExpenseListData } from '@/components/shared/expense-list'
import { type ExpenseCategory } from '@/components/shared/expense-item'
import { getContactTransactions } from '@/features/contacts/data/transaction-store'
import ContactList from '@/components/shared/contact-list'
import ContactListItem from '@/components/shared/contact-list-item'
import SettleUpPanel from '@/features/notifications/components/settle-up-panel'
import { CATEGORIES } from '@/features/personal/components/category-picker'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import SendGroupReminderScreen from '@/features/groups/send-group-reminder-screen'
import AddGroupExpenseScreen from '@/features/groups/add-group-expense-screen'
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
        <span className="text-[#6B6B6B] text-[12px] font-normal">You paid {firstName}</span>
        <span className="text-[12px] text-[#9A9590] mt-0.5 font-normal">Balance adjusted</span>
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

const getCategoryDetails = (catId: string) => {
  if (catId === 'payment') {
    return {
      label: 'Payment',
      color: '#0B683A',
      icon: Handshake,
    }
  }
  const option = CATEGORIES.find((c) => c.id === catId)
  if (option) return option
  return {
    label: 'Other',
    color: '#7F8C8D',
    icon: HelpCircle,
  }
}

/**
 * GroupDetailScreen — displays detailed breakdown of ledgers for a selected group.
 */
const cardVariants = {
  initial: (direction: 'left' | 'right') => ({
    opacity: 0,
    x: direction === 'left' ? 120 : -120
  }),
  animate: {
    opacity: 1,
    x: 0
  },
  exit: (direction: 'left' | 'right') => ({
    opacity: 0,
    x: direction === 'left' ? -120 : 120
  })
}

export default function GroupDetailScreen() {
  const { id } = useParams({ from: '/groups/$id/' })
  const navigate = useNavigate({ from: '/groups/$id/' })
  const { drawer, txId } = useSearch({ from: '/groups/$id/' })

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

  const openDrawer = (name: 'reminder' | 'add-expense' | 'edit-expense' | 'transaction', tid?: string) => {
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

  // State to filter by category
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // State to trigger Settle Up Drawer
  const [showSettleUp, setShowSettleUp] = useState(false)

  // State for active carousel card index (0 for Net Balance, 1 for Receive/Pay breakdown)
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left')

  // Get grouped transaction history
  const transactions = useMemo(() => GET_TRANSACTIONS(id, contact.name), [id, contact.name])

  // Flat combined list of expenses with custom category icon, background highlights, and chevron overrides matching the mockup
  const groupExpensesData = useMemo(() => {
    const flat = [...transactions.Today, ...transactions.Yesterday, ...transactions.Earlier]
    return flat.map((expense) => {
      // If Hotel Booking, add building icon
      if (expense.name.toLowerCase().includes('hotel')) {
        return {
          ...expense,
          amountColor: 'black' as const,
          leftSlot: (
            <div className="w-12 h-12 rounded-[13px] bg-[#E3F2FD] flex items-center justify-center shrink-0">
              <Building2 size={24} className="text-[#1F618D]" />
            </div>
          )
        }
      }

      // If payment category, color green and hide chevron
      if (expense.category === 'payment') {
        return {
          ...expense,
          amountColor: 'green' as const,
          showChevron: false,
          className: 'bg-[#ECF6F0] hover:bg-[#ECF6F0]/90 text-[#0B683A]'
        }
      }

      // Default: color black
      return {
        ...expense,
        amountColor: 'black' as const
      }
    })
  }, [transactions])

  // Group groupExpensesData by category
  const categoriesSummary = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {}
    groupExpensesData.forEach((exp) => {
      const cat = exp.category || 'other'
      if (!map[cat]) {
        map[cat] = { count: 0, total: 0 }
      }
      map[cat].count += 1
      map[cat].total += Math.abs(exp.amount)
    })
    return Object.entries(map).map(([catId, summary]) => {
      const details = getCategoryDetails(catId)
      return {
        id: catId,
        label: details.label,
        count: summary.count,
        total: summary.total,
        color: details.color,
        icon: details.icon,
      }
    })
  }, [groupExpensesData])

  const groupBalances = useMemo(() => {
    if (id === '5') {
      return [
        {
          id: 'gb1',
          name: 'Ali Hassan',
          initials: 'AH',
          avatarColor: 'bg-[#E8F5E9] text-[#0B683A]',
          subtitle: 'Has to pay you',
          direction: 'in' as const,
          amount: 3500,
        },
        {
          id: 'gb2',
          name: 'Sara Khan',
          initials: 'SK',
          avatarColor: 'bg-[#FFF8E1] text-[#C96A1B]',
          subtitle: 'Has to pay you',
          direction: 'in' as const,
          amount: 1500,
        },
        {
          id: 'gb3',
          name: 'Usman',
          initials: 'US',
          avatarColor: 'bg-[#E3F2FD] text-[#1E3A8A]',
          subtitle: 'You have to pay',
          direction: 'out' as const,
          amount: 380,
        }
      ]
    }
    // Fallback member balances (Family group or other)
    return [
      {
        id: 'fgb1',
        name: 'Sara Khan',
        initials: 'SK',
        avatarColor: 'bg-[#FFF8E1] text-[#C96A1B]',
        subtitle: 'Has to pay you',
        direction: 'in' as const,
        amount: 1450,
      },
      {
        id: 'fgb2',
        name: 'Hamza Ali',
        initials: 'HA',
        avatarColor: 'bg-[#E3F2FD] text-[#1E3A8A]',
        subtitle: 'You have to pay',
        direction: 'out' as const,
        amount: 250,
      }
    ]
  }, [id])

  const isGroupReceivable = contact.netAmount > 0
  const formattedGroupVal = formatCurrency(Math.abs(contact.netAmount), 'PKR')
    .replace('₨', 'Rs.')
    .replace('Rs. ', 'Rs.')

  if (selectedCategory) {
    const catDetails = getCategoryDetails(selectedCategory)
    const filteredExpenses = groupExpensesData.filter((exp) => (exp.category || 'other') === selectedCategory)
    const totalSpent = filteredExpenses.reduce((sum, exp) => sum + Math.abs(exp.amount), 0)
    const formattedTotal = formatCurrency(totalSpent, 'PKR')
      .replace('₨', 'Rs.')
      .replace('Rs. ', 'Rs.')
    const CatIcon = catDetails.icon

    return (
      <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-24 relative select-none">
        {/* Unified Header */}
        <FlowHeader
          title={`${catDetails.label} Expenses`}
          subtitle={`${filteredExpenses.length} ${filteredExpenses.length === 1 ? 'item' : 'items'}`}
          onBack={() => setSelectedCategory(null)}
          backVariant="minimal"
          avatar={
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 border border-[#EFE7DD] shadow-[0px_2px_8px_rgba(0,0,0,0.02)]"
              style={{ backgroundColor: `${catDetails.color}15` }}
            >
              <CatIcon size={20} style={{ color: catDetails.color }} />
            </div>
          }
        />

        {/* Category Spent Summary Card */}
        <div className="px-6 mb-6 mt-4">
          <div className="bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex items-center justify-between">
            <div className="flex flex-col text-left">
              <span className="text-[#6B6B6B] text-[13px] font-semibold">
                Total Category Spent
              </span>
              <span className={cn('text-3xl font-extrabold mt-2 leading-none tracking-tight text-[#1A1A1A]')}>
                {formattedTotal}
              </span>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="flex-1 overflow-y-auto px-6 pb-12 flex flex-col text-left">
          <div className="flex items-center justify-between mb-3 mt-1">
            <h3 className="text-sm font-bold text-[#1A1A1A]">
              Expenses
            </h3>
          </div>

          <ExpenseList
            expenses={filteredExpenses}
            onItemClick={(expenseId) => {
              openDrawer('transaction', expenseId.toString())
            }}
            className="border-[#EFE7DD] divide-[#EFE7DD]"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-24 relative select-none">
      {/* Unified Header */}
      <FlowHeader
        title={contact.name}
        subtitle={`${contact.ledgerCount} members`}
        onBack={() => navigate({ to: ROUTES.DASHBOARD })}
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

      {/* Overall Balance Stat Card Carousel */}
      <div className="px-6 mb-6 mt-4 relative overflow-hidden">
        <div className="relative min-h-[148px]">
          <AnimatePresence custom={slideDirection} mode="wait">
            {activeCardIndex === 0 ? (
              <motion.div
                key="card1"
                custom={slideDirection}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  const swipeThreshold = 50
                  if (info.offset.x < -swipeThreshold) {
                    setSlideDirection('left')
                    setActiveCardIndex(1)
                  } else if (info.offset.x > swipeThreshold) {
                    setSlideDirection('right')
                    setActiveCardIndex(1)
                  }
                }}
                onClick={() => {
                  setSlideDirection('left')
                  setActiveCardIndex(1)
                }}
                className="bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex items-center justify-between cursor-grab active:cursor-grabbing min-h-[148px] relative text-left select-none touch-pan-y"
              >
                <div className="flex flex-col text-left">
                  <span className="text-[#6B6B6B] text-[13px] font-semibold">
                    Net Balance
                  </span>
                  <span className={cn('text-3xl font-extrabold mt-2 leading-none tracking-tight', isGroupReceivable ? 'text-[#0B683A]' : 'text-[#C96A1B]')}>
                    {formattedGroupVal}
                  </span>
                </div>

                {isGroupReceivable && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation() // Prevent toggling the card when clicking remind
                      openDrawer('reminder')
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#0B683A4D] bg-[#E4F2EB] text-[#0B683A] text-xs font-bold transition-all hover:bg-[#E4F2EB]/80 shrink-0 cursor-pointer outline-none"
                  >
                    <Bell size={13} className="text-[#0B683A]" strokeWidth={2.5} />
                    Remind
                  </button>
                )}

                {/* Pagination dots at bottom right */}
                <div className="absolute bottom-3.5 right-4 flex gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSlideDirection('right')
                      setActiveCardIndex(0)
                    }}
                    className="w-2.5 h-2.5 rounded-full bg-[#0B683A] p-0 border-0 outline-none cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSlideDirection('left')
                      setActiveCardIndex(1)
                    }}
                    className="w-2.5 h-2.5 rounded-full bg-[#9A9590]/40 p-0 border-0 outline-none cursor-pointer"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="card2"
                custom={slideDirection}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  const swipeThreshold = 50
                  if (info.offset.x < -swipeThreshold) {
                    setSlideDirection('left')
                    setActiveCardIndex(0)
                  } else if (info.offset.x > swipeThreshold) {
                    setSlideDirection('right')
                    setActiveCardIndex(0)
                  }
                }}
                onClick={() => {
                  setSlideDirection('right')
                  setActiveCardIndex(0)
                }}
                className="bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex items-center justify-between cursor-grab active:cursor-grabbing min-h-[148px] relative text-left select-none touch-pan-y"
              >
                {/* Two Column Layout Split by Light Vertical Line */}
                <div className="flex-1 flex items-stretch divide-x divide-[#EFE7DD] h-full">
                  {/* Left Column: You will receive */}
                  <div className="flex-1 flex flex-col text-left pr-4">
                    <span className="text-[#0B683A] text-[13px] font-bold">
                      You will receive
                    </span>
                    <span className="text-xl font-extrabold text-[#0B683A] mt-2.5 leading-none tracking-tight">
                      Rs. 13,800
                    </span>
                    <div className="mt-3.5 flex items-center justify-start">
                      <div className="w-8 h-8 rounded-full bg-[#E4F2EB] flex items-center justify-center text-[#0B683A]">
                        <ArrowDown size={14} className="text-[#0B683A]" strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: You will pay */}
                  <div className="flex-1 flex flex-col text-left pl-6">
                    <span className="text-[#C96A1B] text-[13px] font-bold">
                      You will pay
                    </span>
                    <span className="text-xl font-extrabold text-[#C96A1B] mt-2.5 leading-none tracking-tight">
                      Rs. 2,230
                    </span>
                    <div className="mt-3.5 flex items-center justify-start">
                      <div className="w-8 h-8 rounded-full bg-[#FFF8E1] flex items-center justify-center text-[#C96A1B]">
                        <ArrowUp size={14} className="text-[#C96A1B]" strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pagination dots at bottom right */}
                <div className="absolute bottom-3.5 right-4 flex gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSlideDirection('right')
                      setActiveCardIndex(0)
                    }}
                    className="w-2.5 h-2.5 rounded-full bg-[#9A9590]/40 p-0 border-0 outline-none cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSlideDirection('left')
                      setActiveCardIndex(1)
                    }}
                    className="w-2.5 h-2.5 rounded-full bg-[#0B683A] p-0 border-0 outline-none cursor-pointer"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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
                  let targetId = mb.id
                  if (mb.name === 'Ali Hassan') {
                    targetId = '1'
                  } else if (mb.name === 'Sara Khan') {
                    targetId = '2'
                  } else {
                    targetId = '1' // Fallback to Ali Hassan (existing mock data)
                  }
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
              const formattedVal = formatCurrency(summary.total, 'PKR')
                .replace('₨', 'Rs.')
                .replace('Rs. ', 'Rs.')
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
      <div className="fixed bottom-0 left-0 right-0 z-10 px-6 py-4 bg-[#FEFAF1]/90 flex items-center gap-4 border-t border-[#EFE7DD]/30 backdrop-blur-sm">
        {/* + Add Expense */}
        <button
          type="button"
          onClick={() => openDrawer('add-expense')}
          className="flex-1 h-14 rounded-full bg-[#0B683A] text-white font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
        >
          Add Expense
        </button>

        {/* Settle Up */}
        <button
          type="button"
          onClick={() => setShowSettleUp(true)}
          className="flex-1 h-14 rounded-full bg-[#FDB105] text-[#1A1A1A] font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
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
            console.log('Group Settle Up Confirmed!')
          }}
        />
      )}

      <Drawer open={drawer === 'reminder'} onOpenChange={(open) => !open && closeDrawer()}>
        <DrawerContent className="bg-white p-0 flex flex-col focus:outline-none overflow-hidden text-[#1A1A1A] data-[vaul-drawer-direction=bottom]:h-full! data-[vaul-drawer-direction=bottom]:max-h-full! data-[vaul-drawer-direction=bottom]:rounded-none! data-[vaul-drawer-direction=bottom]:border-0! data-[vaul-drawer-direction=bottom]:mt-0! [&>div:first-child]:hidden!">
          {drawer === 'reminder' && (
            <SendGroupReminderScreen groupId={contact.id} onClose={closeDrawer} />
          )}
        </DrawerContent>
      </Drawer>

      <Drawer open={drawer === 'add-expense'} onOpenChange={(open) => !open && closeDrawer()}>
        <DrawerContent className="bg-white p-0 flex flex-col focus:outline-none overflow-hidden text-[#1A1A1A] data-[vaul-drawer-direction=bottom]:h-full! data-[vaul-drawer-direction=bottom]:max-h-full! data-[vaul-drawer-direction=bottom]:rounded-none! data-[vaul-drawer-direction=bottom]:border-0! data-[vaul-drawer-direction=bottom]:mt-0! [&>div:first-child]:hidden!">
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
        <DrawerContent className="bg-white p-0 flex flex-col focus:outline-none overflow-hidden text-[#1A1A1A] data-[vaul-drawer-direction=bottom]:h-full! data-[vaul-drawer-direction=bottom]:max-h-full! data-[vaul-drawer-direction=bottom]:rounded-none! data-[vaul-drawer-direction=bottom]:border-0! data-[vaul-drawer-direction=bottom]:mt-0! [&>div:first-child]:hidden!">
          {drawer === 'transaction' && txId && (
            <TransactionDetailScreen
              txId={txId}
              onClose={closeDrawer}
              onDelete={closeDrawer}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}
