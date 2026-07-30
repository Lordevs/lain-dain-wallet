import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ChevronRight, Download, AlertCircle, Trash2 } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { formatCurrency } from '@/lib/currency'
import FlowHeader from '@/components/shared/flow-header'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import ConfirmActionDrawer from '@/components/shared/confirm-action-drawer'
import { usePersonalExpenseSettingsQuery } from '@/features/expenses/api/use-personal-expense-settings-query'
import { useUpdatePersonalExpenseSettingsMutation } from '@/features/expenses/api/use-update-personal-expense-settings-mutation'
import { useCategoryBudgetsQuery } from '@/features/expenses/api/use-category-budgets-query'
import { useClearPersonalHistoryMutation } from '@/features/expenses/api/use-clear-personal-history-mutation'

function getOrdinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default function PersonalSettingsScreen() {
  const navigate = useNavigate()
  const settingsQuery = usePersonalExpenseSettingsQuery()
  const updateSettings = useUpdatePersonalExpenseSettingsMutation()
  const categoryBudgetsQuery = useCategoryBudgetsQuery()
  const clearHistory = useClearPersonalHistoryMutation()

  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)

  const settings = settingsQuery.data

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none overflow-hidden">
      {/* Top Header */}
      <FlowHeader
        title="Personal Expense Settings"
        backVariant="circle"
      />

      {/* Main Settings Scroll Container */}
      <div className="flex-1 overflow-y-auto px-6 flex flex-col gap-3">

        {/* DISPLAY SECTION */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-semibold text-[#6B6B6B] tracking-[0.8px] mb-0.5 px-1 uppercase">
            Display
          </h4>
          <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EFE7DD] overflow-hidden text-left">
            {/* Hide Ledgers */}
            <div
              className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer"
              onClick={() => navigate({ to: ROUTES.PERSONAL_HIDE_LEDGERS })}
            >
              <div className="flex flex-col text-left pr-4">
                <span className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Hide Ledgers</span>
                <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">Groups or contacts added in expense</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 select-none">
                <span className="text-[13px] font-semibold text-[#6B6B6B]">View</span>
                <ChevronRight size={14} className="text-[#6B6B6B]" strokeWidth={2.5} />
              </div>
            </div>

            {/* Default Period */}
            <div
              className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer"
              onClick={() => navigate({ to: ROUTES.PERSONAL_DEFAULT_PERIOD })}
            >
              <div className="flex flex-col text-left pr-4">
                <span className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Default period</span>
                <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">Time range shown on open</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 select-none">
                {settings ? (
                  <span className="text-[13px] font-semibold text-[#6B6B6B]">{getOrdinal(settings.period_start_day)}</span>
                ) : (
                  <Skeleton className="h-3.5 w-8" />
                )}
                <ChevronRight size={14} className="text-[#6B6B6B]" strokeWidth={2.5} />
              </div>
            </div>

            {/* Show spending comparison */}
            <div
              className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer"
              onClick={() => settings && updateSettings.mutate({ show_spending_comparison: !settings.show_spending_comparison })}
            >
              <div className="flex flex-col text-left pr-4">
                <span className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Show spending comparison</span>
                <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">"Rs. X more than last month"</span>
              </div>
              <div className="shrink-0 select-none" onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={settings?.show_spending_comparison ?? false}
                  disabled={!settings}
                  onCheckedChange={(checked) => updateSettings.mutate({ show_spending_comparison: checked })}
                  size="lg"
                />
              </div>
            </div>

          </div>
        </div>

        {/* NOTIFICATIONS SECTION */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-semibold text-[#6B6B6B] tracking-[0.8px] mb-0.5 px-1 uppercase">
            Notifications
          </h4>
          <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EFE7DD] overflow-hidden text-left ">

            {/* Monthly spending alert */}
            <div
              className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer"
              onClick={() => settings && updateSettings.mutate({ budget_alert_enabled: !settings.budget_alert_enabled })}
            >
              <div className="flex flex-col text-left pr-4">
                <span className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Monthly spending alert</span>
                <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">Notify when nearing budget</span>
              </div>
              <div className="shrink-0 select-none" onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={settings?.budget_alert_enabled ?? false}
                  disabled={!settings}
                  onCheckedChange={(checked) => updateSettings.mutate({ budget_alert_enabled: checked })}
                  size="lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BUDGET SECTION */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-semibold text-[#6B6B6B] tracking-[0.8px] mb-0.5 px-1 uppercase">
            Budget
          </h4>
          <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EFE7DD] overflow-hidden text-left ">

            {/* Monthly budget limit */}
            <div
              className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer"
              onClick={() => navigate({ to: ROUTES.PERSONAL_BUDGET_LIMIT })}
            >
              <div className="flex flex-col text-left pr-4">
                <span className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Monthly budget limit</span>
                <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">Get alerted if you go over</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 select-none">
                {settings ? (
                  <span className="text-[13px] font-semibold text-[#6B6B6B]">
                    {settings.monthly_budget_limit
                      ? formatCurrency(Number(settings.monthly_budget_limit), 'PKR')
                      : 'Not set'}
                  </span>
                ) : (
                  <Skeleton className="h-3.5 w-14" />
                )}
                <ChevronRight size={14} className="text-[#6B6B6B]" strokeWidth={2.5} />
              </div>
            </div>

            {/* Category budgets */}
            <div
              className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer"
              onClick={() => navigate({ to: ROUTES.PERSONAL_CATEGORY_BUDGETS })}
            >
              <div className="flex flex-col text-left pr-4">
                <span className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Category budgets</span>
                <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">Set limits per category</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 select-none">
                <ChevronRight size={14} className="text-[#6B6B6B]" strokeWidth={2.5} />
              </div>
            </div>

          </div>
        </div>

        {/* DATA SECTION */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-semibold text-[#6B6B6B] tracking-[0.8px] mb-0.5 px-1 uppercase">
            Data
          </h4>
          <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EFE7DD] overflow-hidden text-left ">

            {/* Export All Data */}
            <div className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-[12px] bg-[#ECF6F0] text-positive flex items-center justify-center shrink-0">
                  <Download size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Export All Data</span>
                  <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">CSV file of all expenses</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 select-none">
                <ChevronRight size={14} className="text-[#6B6B6B]" strokeWidth={2.5} />
              </div>
            </div>

            {/* Manage Categories */}
            <div
              onClick={() => navigate({ to: ROUTES.PERSONAL_CATEGORIES })}
              className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-[12px] bg-[#ECF6F0] text-positive flex items-center justify-center shrink-0">
                  <AlertCircle size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Manage Categories</span>
                  <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">
                    {categoryBudgetsQuery.data ? `${categoryBudgetsQuery.data.categories.length} categories` : '...'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 select-none">
                <ChevronRight size={14} className="text-[#6B6B6B]" strokeWidth={2.5} />
              </div>
            </div>

          </div>
        </div>

        {/* DANGER ZONE SECTION */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-semibold text-[#6B6B6B] tracking-[0.8px] mb-0.5 px-1 uppercase">
            Danger Zone
          </h4>
          <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EFE7DD] overflow-hidden text-left mb-4">

            {/* Clear All Personal Expenses */}
            <div
              onClick={() => setIsClearConfirmOpen(true)}
              className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-[12px] bg-[#FDF3F3] text-[#EB5757] flex items-center justify-center shrink-0">
                  <Trash2 size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[15px] font-semibold text-[#C0392B] leading-tight">Clear All Personal Expenses</span>
                  <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">Permanently delete history</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 select-none">
                <ChevronRight size={14} className="text-[#6B6B6B]" strokeWidth={2.5} />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Clear All Expenses Confirmation Drawer */}
      <ConfirmActionDrawer
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        title="Clear All Personal Expenses"
        confirmTitle="Clear All Personal Expenses"
        confirmDescription="Are you sure you want to permanently clear all your personal expenses? This action cannot be undone."
        buttonText="Clear All Expenses"
        variant="danger"
        onConfirm={() => {
          clearHistory.mutate(undefined, {
            onSuccess: () => {
              setIsClearConfirmOpen(false)
              toast.success('All personal expenses cleared')
            },
            onError: (err) => toast.error(err.message),
          })
        }}
      />
    </div>
  )
}
