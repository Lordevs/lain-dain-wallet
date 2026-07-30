import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Home, Music, Pencil, Trash2, Plus, Video } from 'lucide-react'
import { toast } from 'sonner'
import FlowHeader from '@/components/shared/flow-header'
import ContactAvatar from '@/components/shared/contact-avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/use-auth-store'
import { useGroupQuery } from '@/features/groups/api/use-group-query'
import { useGroupRecurringQuery } from '@/features/groups/api/use-group-recurring-query'
import { useDeleteGroupRecurringMutation } from '@/features/groups/api/use-group-recurring-mutations'
import { initialsForName, colorForName } from '@/lib/avatar-visuals'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'

interface RecurringPaymentsScreenProps {
  groupId: string
  onClose: () => void
}

export default function RecurringPaymentsScreen({ groupId, onClose }: RecurringPaymentsScreenProps) {
  const navigate = useNavigate()

  const userProfile = useAuthStore((state) => state.userProfile)
  const myId = userProfile?.id ?? ''

  const { data: group } = useGroupQuery(groupId)
  const { data: payments = [], isLoading } = useGroupRecurringQuery(groupId)
  const deleteMutation = useDeleteGroupRecurringMutation(groupId)

  const myMember = group?.members.find((m) => m.id === myId)
  const isAdmin = myMember?.role === 'owner' || myMember?.role === 'admin' || group?.created_by === myId

  // Calculate Monthly total dynamically from API items
  const monthlyTotal = useMemo(() => {
    return payments.reduce((sum, item) => {
      const amt = Number(item.amount) || 0
      const freq = (item.frequency as string)?.toLowerCase()
      if (freq === 'weekly') return sum + amt * 4.33
      if (freq === 'yearly') return sum + amt / 12
      return sum + amt
    }, 0)
  }, [payments])

  const activeCount = payments.length

  const handleDelete = async (paymentId: string) => {
    try {
      await deleteMutation.mutateAsync(paymentId)
      toast.success('Recurring payment deleted')
    } catch {
      // Toast error is handled in mutation onError
    }
  }

  const handleEdit = (paymentId: string) => {
    navigate({
      to: ROUTES.GROUP_EDIT_RECURRING,
      params: { id: groupId, paymentId },
    })
  }

  const getCategoryVisuals = (categoryName?: string, paymentName?: string) => {
    const nameStr = (paymentName || categoryName || '').toLowerCase()
    if (nameStr.includes('spotify') || nameStr.includes('music')) {
      return { Icon: Music, iconColor: '#27AE60', bgColor: 'bg-[#E8F5E9]' }
    }
    if (nameStr.includes('netflix') || nameStr.includes('video') || nameStr.includes('movie')) {
      return { Icon: Video, iconColor: '#EB5757', bgColor: 'bg-[#FFF0F0]' }
    }
    return { Icon: Home, iconColor: '#2F80ED', bgColor: 'bg-[#E3F2FD]' }
  }

  return (
    <div className="fixed inset-0 z-60 flex flex-col bg-[#FEFAF1] pb-24 select-none text-left">
      {/* Page Header */}
      <FlowHeader
        title="Recurring Payments"
        onBack={onClose}
        backVariant="circle"
      />

      <div className="px-5 flex flex-col gap-5 overflow-y-auto mt-3 flex-1 min-h-0">
        {/* Summary Cards */}
        <div className="flex items-center gap-4">
          {/* Monthly Total Card */}
          <div className="flex-1 bg-white border border-[#EBEBEB] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-5 flex flex-col">
            <span className="text-[12px] font-bold text-[#6B6B6B] tracking-wider uppercase">
              Monthly total
            </span>
            <span className="text-[22px] font-extrabold text-positive mt-1.5 leading-none">
              Rs. {Math.round(monthlyTotal).toLocaleString('en-US')}
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

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-[24px]" />
              <Skeleton className="h-24 w-full rounded-[24px]" />
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-white border border-[#EBEBEB] rounded-[24px] p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
              <span className="text-3xl mb-2">⏱️</span>
              <p className="text-sm font-semibold text-[#6B6B6B]">No active recurring payments</p>
              <p className="text-[12px] text-[#9A9590] mt-1">Add subscriptions, rent, bills or repeating costs.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#EBEBEB] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EBEBEB] overflow-hidden">
              {payments.map((p) => {
                const { Icon, iconColor, bgColor } = getCategoryVisuals(p.category?.name, p.description)
                const mainPayer = p.payers?.[0]
                const payerName = mainPayer ? (mainPayer.id === myId ? 'You' : mainPayer.full_name) : 'Group'
                const payerInitials = initialsForName(payerName)
                const payerColor = colorForName(payerName)
                const amountNum = Number(p.amount) || 0

                return (
                  <div key={p.id} className="flex items-center justify-between p-5 hover:bg-muted/5 transition-colors">
                    {/* Left details */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className={cn("w-14 h-14 rounded-[18px] flex items-center justify-center shrink-0 border border-black/5 shadow-sm", bgColor)}>
                        <Icon size={22} style={{ color: iconColor }} strokeWidth={2} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-[15px] text-[#1A1A1A] leading-tight truncate">
                          {p.description}
                        </h4>

                        {/* Payer + Amount Row */}
                        <div className="flex items-center justify-between mt-1.5 pr-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <ContactAvatar
                              initials={payerInitials}
                              avatarColor={payerColor}
                              src={mainPayer?.image ?? undefined}
                              size="sm"
                            />
                            <span className="text-[13px] text-[#6B6B6B] font-semibold truncate leading-none">
                              Paid by {payerName}
                            </span>
                          </div>
                          <span className="text-[15px] font-black text-[#1A1A1A] leading-none shrink-0">
                            {p.currency ?? 'PKR'} {amountNum.toLocaleString('en-US')}
                          </span>
                        </div>

                        {/* Frequency & Next Billing Date */}
                        <p className="text-[12px] font-extrabold mt-1.5 leading-none text-positive">
                          {p.frequency ? p.frequency.charAt(0).toUpperCase() + p.frequency.slice(1) : 'Monthly'} · Next: {p.next_occurrence}
                        </p>
                      </div>
                    </div>

                    {/* Right Edit & Delete Actions (for Admin/Owner) */}
                    {isAdmin && (
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <button
                          type="button"
                          onClick={() => handleEdit(p.id)}
                          className="w-9 h-9 bg-[#E4F2EB] text-positive rounded-[10px] flex items-center justify-center cursor-pointer active:scale-95 border-0 hover:bg-[#E4F2EB]/80 transition-all outline-none"
                          title="Edit"
                        >
                          <Pencil size={15} strokeWidth={2.5} className="text-positive" />
                        </button>
                        <button
                          type="button"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(p.id)}
                          className="w-9 h-9 bg-[#FFF0F0] text-[#EB5757] rounded-[10px] flex items-center justify-center cursor-pointer active:scale-95 border-0 hover:bg-[#FFF0F0]/80 transition-all outline-none disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={15} strokeWidth={2.5} className="text-[#EB5757]" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Absolute Bottom Actions Bar (Admin/Owner only) */}
      {isAdmin && (
        <div className="fixed bottom-3 left-3 right-3 z-10">
          <button
            type="button"
            onClick={() => navigate({ to: ROUTES.GROUP_ADD_RECURRING, params: { id: groupId } })}
            className="w-full h-14 bg-positive text-white rounded-full font-bold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-0 pointer-events-auto shadow-lg"
          >
            <Plus size={18} strokeWidth={3} />
            Add New
          </button>
        </div>
      )}
    </div>
  )
}
