import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ChevronRight, Download, AlertCircle, Trash2 } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import FlowHeader from '@/components/shared/flow-header'
import { Switch } from '@/components/ui/switch'
import ConfirmActionDrawer from '@/components/shared/confirm-action-drawer'

export default function PersonalSettingsScreen() {
  const navigate = useNavigate()
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)
  const [showSpendingComp, setShowSpendingComp] = useState(true)
  const [monthlyAlert, setMonthlyAlert] = useState(true)
  const [recurringRemind, setRecurringRemind] = useState(true)

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none overflow-hidden">
      {/* Top Header */}
      <FlowHeader
        title="Personal Expense Settings"
        backVariant="circle"
      />

      {/* Main Settings Scroll Container */}
      <div className="flex-1 overflow-y-auto px-6 flex flex-col gap-1">

        {/* DISPLAY SECTION */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-bold text-[#6B6B6B] tracking-widest mb-2.5 px-1 uppercase">
            Display
          </h4>
          <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EFE7DD] overflow-hidden text-left mb-6">

            {/* Default View */}
            <div className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer">
              <div className="flex flex-col text-left pr-4">
                <span className="text-[15px] font-bold text-[#1A1A1A] leading-tight">Default view</span>
                <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">Groups or All categories first</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 select-none">
                <span className="text-sm font-semibold text-[#6B6B6B]">Groups</span>
                <ChevronRight size={14} className="text-[#6B6B6B]" strokeWidth={2.5} />
              </div>
            </div>

            {/* Default Period */}
            <div className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer">
              <div className="flex flex-col text-left pr-4">
                <span className="text-[15px] font-bold text-[#1A1A1A] leading-tight">Default period</span>
                <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">Time range shown on open</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 select-none">
                <span className="text-sm font-semibold text-[#6B6B6B]">This month</span>
                <ChevronRight size={14} className="text-[#6B6B6B]" strokeWidth={2.5} />
              </div>
            </div>

            {/* Show spending comparison */}
            <div
              className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer"
              onClick={() => setShowSpendingComp(!showSpendingComp)}
            >
              <div className="flex flex-col text-left pr-4">
                <span className="text-[15px] font-bold text-[#1A1A1A] leading-tight">Show spending comparison</span>
                <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">"Rs. X more than last month"</span>
              </div>
              <div className="shrink-0 select-none" onClick={(e) => e.stopPropagation()}>
                <Switch checked={showSpendingComp} onCheckedChange={setShowSpendingComp} size="lg" />
              </div>
            </div>

          </div>
        </div>

        {/* NOTIFICATIONS SECTION */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-bold text-[#6B6B6B] tracking-widest mb-2.5 px-1 uppercase">
            Notifications
          </h4>
          <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EFE7DD] overflow-hidden text-left mb-6">

            {/* Monthly spending alert */}
            <div
              className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer"
              onClick={() => setMonthlyAlert(!monthlyAlert)}
            >
              <div className="flex flex-col text-left pr-4">
                <span className="text-[15px] font-bold text-[#1A1A1A] leading-tight">Monthly spending alert</span>
                <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">Notify when nearing budget</span>
              </div>
              <div className="shrink-0 select-none" onClick={(e) => e.stopPropagation()}>
                <Switch checked={monthlyAlert} onCheckedChange={setMonthlyAlert} size="lg" />
              </div>
            </div>

            {/* Recurring payment reminders */}
            <div
              className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer"
              onClick={() => setRecurringRemind(!recurringRemind)}
            >
              <div className="flex flex-col text-left pr-4">
                <span className="text-[15px] font-bold text-[#1A1A1A] leading-tight">Recurring payment reminders</span>
                <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">3 days before due date</span>
              </div>
              <div className="shrink-0 select-none" onClick={(e) => e.stopPropagation()}>
                <Switch checked={recurringRemind} onCheckedChange={setRecurringRemind} size="lg" />
              </div>
            </div>

          </div>
        </div>

        {/* BUDGET SECTION */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-bold text-[#6B6B6B] tracking-widest mb-2.5 px-1 uppercase">
            Budget
          </h4>
          <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EFE7DD] overflow-hidden text-left mb-6">

            {/* Monthly budget limit */}
            <div className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer">
              <div className="flex flex-col text-left pr-4">
                <span className="text-[15px] font-bold text-[#1A1A1A] leading-tight">Monthly budget limit</span>
                <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">Get alerted if you go over</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 select-none">
                <span className="text-sm font-semibold text-[#6B6B6B]">Rs. 50,000</span>
                <ChevronRight size={14} className="text-[#6B6B6B]" strokeWidth={2.5} />
              </div>
            </div>

            {/* Category budgets */}
            <div className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer">
              <div className="flex flex-col text-left pr-4">
                <span className="text-[15px] font-bold text-[#1A1A1A] leading-tight">Category budgets</span>
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
          <h4 className="text-[11px] font-bold text-[#6B6B6B] tracking-widest mb-2.5 px-1 uppercase">
            Data
          </h4>
          <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EFE7DD] overflow-hidden text-left mb-6">

            {/* Export All Data */}
            <div className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5 cursor-pointer">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-[12px] bg-[#ECF6F0] text-[#0B683A] flex items-center justify-center shrink-0">
                  <Download size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[15px] font-bold text-[#1A1A1A] leading-tight">Export All Data</span>
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
                <div className="w-10 h-10 rounded-[12px] bg-[#ECF6F0] text-[#0B683A] flex items-center justify-center shrink-0">
                  <AlertCircle size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[15px] font-bold text-[#1A1A1A] leading-tight">Manage Categories</span>
                  <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">8 categories</span>
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
          <h4 className="text-[11px] font-bold text-[#6B6B6B] tracking-widest mb-2.5 px-1 uppercase">
            Danger Zone
          </h4>
          <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EFE7DD] overflow-hidden text-left mb-10">

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
                  <span className="text-[15px] font-bold text-[#C0392B] leading-tight">Clear All Personal Expenses</span>
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
          console.log('All personal expenses cleared!')
          setIsClearConfirmOpen(false)
        }}
      />
    </div>
  )
}
