import { useParams } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'
import smartSettleImg from '@/assets/smart-settle.png'
import { useAuthStore } from '@/store/use-auth-store'
import { useGroupQuery } from '@/features/groups/api/use-group-query'
import { useUpdateGroupMutation } from '@/features/groups/api/use-update-group-mutation'
import { getGroupPermissions } from '@/features/groups/lib/group-roles'

export default function SmartSettleScreen() {
  const { id } = useParams({ strict: false })
  const userProfile = useAuthStore((state) => state.userProfile)
  const myId = userProfile?.id ?? ''

  const groupQuery = useGroupQuery(id)
  const group = groupQuery.data
  const updateGroup = useUpdateGroupMutation(id ?? '')

  const { isAdmin } = getGroupPermissions(group, myId)

  const isSimplified = group?.smart_settle_enabled ?? true

  const handleToggle = () => {
    if (!id || !isAdmin || updateGroup.isPending) return
    updateGroup.mutate({ smart_settle_enabled: !isSimplified })
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FEFAF1] pb-12 select-none text-left overflow-y-auto">
      {/* Header */}
      <FlowHeader
        title="Smart Settle"
        onBack={() => window.history.back()}
        backVariant="circle"
      />

      <div className="px-6 flex flex-col gap-6 overflow-y-auto pb-8">
        {/* Intro */}
        <div className="mt-2 text-left">
          <h2 className="text-[26px] font-extrabold text-[#044327] tracking-tight leading-tight">
            What is smart settle?
          </h2>
          <p className="text-[14px] text-[#4A4A4A] font-medium leading-relaxed mt-3">
            smart settle rearranges who pays whom in your group to reduce the number of
            payments needed. It does not change the total amount anyone owes—it only reduces
            the number of transactions.
          </p>
        </div>

        {/* Diagram Illustration */}
        <div className="w-full flex items-center justify-center my-2 select-none">
          <img
            src={smartSettleImg}
            alt="Smart Settle Diagram"
            className={cn(
              "w-full max-w-[340px] h-auto object-contain transition-all duration-300",
              isSimplified ? "opacity-100 filter-none" : "opacity-40 grayscale-30"
            )}
          />
        </div>

        {/* Simplify Toggle Row */}
        <div className="flex items-center justify-end gap-2.5 my-1.5 px-1 select-none">
          <span className="text-sm font-extrabold text-[#1A1A1A]">Simplify:</span>
          <button
            type="button"
            onClick={handleToggle}
            disabled={updateGroup.isPending || !isAdmin}
            className={cn(
              "relative inline-flex h-7 w-15 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none disabled:opacity-50",
              isAdmin ? "cursor-pointer" : "cursor-not-allowed",
              isSimplified ? "bg-positive" : "bg-[#9A9590]"
            )}
          >
            {/* Toggle Status Text Inside Switch */}
            <span
              className={cn(
                "absolute text-[9px] font-extrabold text-white transition-opacity select-none duration-200",
                isSimplified ? "left-2 opacity-100" : "right-2 opacity-0"
              )}
            >
              ON
            </span>
            <span
              className={cn(
                "absolute text-[9px] font-extrabold text-white transition-opacity select-none duration-200",
                isSimplified ? "left-2 opacity-0" : "right-2 opacity-100"
              )}
            >
              OFF
            </span>
            {/* Toggle Circle Handle */}
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                isSimplified ? "translate-x-8" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {/* Example Section */}
        <div className="mt-2 text-left">
          <h3 className="text-[20px] font-extrabold text-[#044327] tracking-tight leading-tight">
            Example
          </h3>
          <p className="text-[14px] text-[#4A4A4A] font-medium leading-relaxed mt-3">
            Haseeb owes Mehrunisa Rs. 2,000 and Mehrunisa owes Sarina Rs. 2,000. With simplify
            debts turned on, Lain Dain tells Haseeb to pay Sarina directly. Mehrunisa does not
            need to make a separate payment. This settles the same balances with fewer steps.
          </p>
        </div>
      </div>
    </div>
  )
}
