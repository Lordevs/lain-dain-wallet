import { useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Home, Music, Pencil, Trash2, Plus, Video } from 'lucide-react'
import FlowHeader from '@/components/shared/flow-header'
import { useRecurringStore } from '@/store/use-recurring-store'
import { MOCK_GROUP_MEMBERS } from '@/features/groups/data/group-members'
import { cn } from '@/lib/utils'
import AddRecurringScreen from '@/features/groups/add-recurring-screen'


interface RecurringPaymentsScreenProps {
  groupId: string
  onClose: () => void
}

export default function RecurringPaymentsScreen({ groupId, onClose }: RecurringPaymentsScreenProps) {
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const isAddRecurringOpen = search?.subDrawer === 'add-recurring' || search?.drawer === 'add-recurring'
  const editPaymentId = search?.edit as string | undefined

  const closeAddRecurringDrawer = () => {
    (navigate as any)({
      search: (prev: any) => {
        const next = { ...prev }
        delete next.subDrawer
        if (next.drawer === 'add-recurring') {
          delete next.drawer
        }
        delete next.edit
        return next
      },
    })
  }

  const { deletePayment } = useRecurringStore()
  const payments = useRecurringStore((s) => s.paymentsByGroup[groupId] ?? [])

  // Calculate Monthly total and Active count dynamically
  const monthlyTotal = useMemo(
    () => payments.reduce((sum, item) => sum + item.amount, 0),
    [payments]
  )

  const activeCount = payments.length

  // Delete payment handler — updates Zustand store (triggers re-render)
  const handleDelete = (paymentId: string) => {
    deletePayment(groupId, paymentId)
  }

  // Edit payment handler — search params are typed via route's validateSearch
  const handleEdit = (paymentId: string) => {
    (navigate as any)({
      search: (prev: any) => ({
        ...prev,
        subDrawer: 'add-recurring',
        edit: paymentId,
      }),
    })
  }

  const handleBack = () => {
    onClose()
  }

  // Map category ID to Icon and Visual design styles
  const getCategoryVisuals = (categoryId: string, paymentName: string) => {
    const lowerName = paymentName.toLowerCase()
    if (lowerName.includes('spotify') || categoryId === 'music') {
      return {
        Icon: Music,
        iconColor: '#27AE60',
        bgColor: 'bg-[#E8F5E9]'
      }
    }
    if (lowerName.includes('netflix') || categoryId === 'entertainment') {
      return {
        Icon: Video,
        iconColor: '#EB5757',
        bgColor: 'bg-[#FFF0F0]'
      }
    }
    if (lowerName.includes('rent') || lowerName.includes('house') || categoryId === 'bills') {
      return {
        Icon: Home,
        iconColor: '#2F80ED',
        bgColor: 'bg-[#E3F2FD]'
      }
    }
    // Default fallback
    return {
      Icon: Home,
      iconColor: '#16A085',
      bgColor: 'bg-[#E0F2F1]'
    }
  }

  // Resolve payer avatar initials and color from shared MOCK_GROUP_MEMBERS
  const getPayerVisuals = (paidById: string) => {
    const found = MOCK_GROUP_MEMBERS.find((m) => m.id === paidById)
    if (found) return { initials: found.initials, avatarColor: `${found.avatarColor} text-white` }
    return { initials: '?', avatarColor: 'bg-[#9A9590] text-white' }
  }

  return (
    <div className="fixed inset-0 z-60 flex flex-col bg-[#FEFAF1] pb-24 select-none text-left">
      {/* Page Header */}
      <FlowHeader
        title="Recurring Payments"
        onBack={handleBack}
        backVariant="circle"
      />

      <div className="px-5 flex flex-col gap-5 overflow-y-auto mt-3">
        {/* Summary Cards */}
        <div className="flex items-center gap-4">
          {/* Monthly Total Card */}
          <div className="flex-1 bg-white border border-[#EBEBEB] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-5 flex flex-col">
            <span className="text-[12px] font-bold text-[#6B6B6B] tracking-wider uppercase">
              Monthly total
            </span>
            <span className="text-[22px] font-extrabold text-[#0B683A] mt-1.5 leading-none">
              Rs. {monthlyTotal.toLocaleString('en-US')}
            </span>
          </div>

          {/* Active Payments Card */}
          <div className="flex-1 bg-white border border-[#EBEBEB] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-5 flex flex-col">
            <span className="text-[12px] font-bold text-[#6B6B6B] tracking-wider uppercase">
              Active
            </span>
            <span className="text-[22px] font-extrabold text-[#1A1A1A] mt-1.5 leading-none">
              {activeCount} {activeCount === 1 ? 'payment' : 'payments'}
            </span>
          </div>
        </div>

        {/* List Section */}
        <div className="flex flex-col mt-2">
          <h3 className="text-[13px] font-bold text-[#6B6B6B] tracking-wider mb-2.5 px-1 uppercase">
            Active
          </h3>

          {payments.length === 0 ? (
            <div className="bg-white border border-[#EBEBEB] rounded-[24px] p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
              <span className="text-3xl mb-2">⏱️</span>
              <p className="text-sm font-semibold text-[#6B6B6B]">No active recurring payments</p>
              <p className="text-[12px] text-[#9A9590] mt-1">Add subscriptions, rent, bills or repeating costs.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#EBEBEB] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EBEBEB] overflow-hidden">
              {payments.map((p) => {
                const { Icon, iconColor, bgColor } = getCategoryVisuals(p.category, p.name)
                const { initials, avatarColor } = getPayerVisuals(p.paidById)
                const isSoon = p.nextBillingStatus === 'orange' || p.nextBillingDate.includes('15') || p.nextBillingDate.includes('1')

                return (
                  <div key={p.id} className="flex items-center justify-between p-5 hover:bg-muted/5 transition-colors">
                    {/* Left details (Icon + Text block) */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Category Icon */}
                      <div className={cn("w-14 h-14 rounded-[18px] flex items-center justify-center shrink-0 border border-black/5 shadow-sm", bgColor)}>
                        <Icon size={22} style={{ color: iconColor }} strokeWidth={2} />
                      </div>

                      {/* Name, Payer & Amount row, next date */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-[15px] text-[#1A1A1A] leading-tight truncate">
                          {p.name}
                        </h4>

                        {/* Payer + Amount Row */}
                        <div className="flex items-center justify-between mt-1.5 pr-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className={cn("size-5 rounded-full text-white flex items-center justify-center font-extrabold text-[8px] shrink-0 select-none shadow-sm", avatarColor)}>
                              {initials}
                            </div>
                            <span className="text-[13px] text-[#6B6B6B] font-semibold truncate leading-none">
                              {p.paidByName}
                            </span>
                          </div>
                          <span className="text-[15px] font-black text-[#1A1A1A] leading-none shrink-0">
                            Rs. {p.amount.toLocaleString('en-US')}
                          </span>
                        </div>

                        {/* Next Billing Date */}
                        <p className={cn(
                          "text-[12px] font-extrabold mt-1.5 leading-none",
                          isSoon ? "text-[#C96A1B]" : "text-[#0B683A]"
                        )}>
                          Next: {p.nextBillingDate}
                        </p>
                      </div>
                    </div>

                    {/* Right Edit & Delete Actions */}
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleEdit(p.id)}
                        className="w-9 h-9 bg-[#E4F2EB] text-[#0B683A] rounded-[10px] flex items-center justify-center cursor-pointer active:scale-95 border-0 hover:bg-[#E4F2EB]/80 transition-all outline-none"
                        title="Edit"
                      >
                        <Pencil size={15} strokeWidth={2.5} className="text-[#0B683A]" />
                      </button>
                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="w-9 h-9 bg-[#FFF0F0] text-[#EB5757] rounded-[10px] flex items-center justify-center cursor-pointer active:scale-95 border-0 hover:bg-[#FFF0F0]/80 transition-all outline-none"
                        title="Delete"
                      >
                        <Trash2 size={15} strokeWidth={2.5} className="text-[#EB5757]" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Absolute Bottom Actions Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-[#FEFAF1] via-[#FEFAF1] to-transparent shrink-0 pointer-events-none z-10">
        <button
          type="button"
          onClick={() => (navigate as any)({ search: (prev: any) => ({ ...prev, subDrawer: 'add-recurring' }) })}
          className="w-full h-14 bg-[#0B683A] text-white rounded-full font-bold text-base shadow-[0px_8px_20px_rgba(11,104,58,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-0 pointer-events-auto"
        >
          <Plus size={18} strokeWidth={3} />
          Add New
        </button>
      </div>

      {isAddRecurringOpen && (
        <AddRecurringScreen
          groupId={groupId}
          editPaymentId={editPaymentId}
          onClose={closeAddRecurringDrawer}
          onSuccess={closeAddRecurringDrawer}
        />
      )}
    </div>
  )
}
