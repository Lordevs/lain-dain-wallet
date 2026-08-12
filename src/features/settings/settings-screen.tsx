import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ChevronRight,
  User,
  Calendar,
  LogOut,
  Info,
  Trash2,
  Check,
  BellRing,
  LoaderCircle,
} from 'lucide-react'
import { useAuthStore } from '@/store/use-auth-store'
import { ROUTES } from '@/constants/routes'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import FlowHeader from '@/components/shared/flow-header'
import { Switch } from '@/components/ui/switch'
// import CurrencySelectDrawer from '@/components/shared/currency-select-drawer'
// import { getCurrency } from '@/lib/currency'
import { usePersonalExpenseSettingsQuery } from '@/features/expenses/api/use-personal-expense-settings-query'
import { useUpdatePersonalExpenseSettingsMutation } from '@/features/expenses/api/use-update-personal-expense-settings-mutation'
import { useTestNotificationMutation } from '@/features/notifications/api/use-test-notification-mutation'

// ─── Main Screen Component ─────────────────────────────────────────────────────
export default function SettingsScreen() {
  const navigate = useNavigate()
  const { userProfile } = useAuthStore()

  // Local state for interactive settings mockup
  // const [currency, setCurrency] = useState('pkr')
  const [pushNotifications, setPushNotifications] = useState(true)

  const personalSettings = usePersonalExpenseSettingsQuery()
  const updateSettings = useUpdatePersonalExpenseSettingsMutation()
  const testNotification = useTestNotificationMutation()
  const autoReminders = personalSettings.data?.auto_reminder_enabled ?? true
  const reminderInterval = personalSettings.data?.auto_reminder_interval_days === 14 ? 'two_weeks' : 'week'

  // Derive display values from store with mockup fallbacks
  const displayName = userProfile?.name || ''
  const displayPhone = userProfile?.phone || ''

  const initials = displayName
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)


  return (
    <div className="flex flex-col flex-1 pb-10 select-none relative">
      {/* Top Header */}
      <FlowHeader
        title="Settings"
      />

      <div className="flex-1 px-6 flex flex-col">
        {/* Profile Details Header Card */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <Avatar className="w-22 h-22 select-none shadow-[0px_6px_20px_0px_#0B683A52]">
              {userProfile?.avatar ? (
                <AvatarImage src={userProfile.avatar} alt="Profile" className="object-cover" />
              ) : (
                <AvatarFallback className="bg-primary text-white font-bold text-[28px] tracking-tight">
                  {initials || 'MH'}
                </AvatarFallback>
              )}
            </Avatar>
          </div>

          <h2 className="text-[22px] font-extrabold! text-[#1A1A1A] mt-4 tracking-tight leading-tight">
            {displayName}
          </h2>
          <span className="text-[14px] font-medium! text-[#6B6B6B] mt-1.5">
            {displayPhone}
          </span>
        </div>

        {/* Settings Options Grid */}
        <div className="space-y-6">

          {/* ACCOUNT SECTION */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase mb-2 px-1">
              Account
            </h3>
            <div className="bg-white border-[1.5px] border-[#E8E4DC] rounded-[18px] shadow-[0px_2px_10px_0px_#0000000D] overflow-hidden">
              <button
                onClick={() => navigate({ to: ROUTES.USER_PROFILE })}
                className="w-full flex items-center justify-between p-5 text-left active:bg-[#FEFAF1]/80 transition-colors cursor-pointer outline-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-[14px] bg-[#E4F2EB] flex items-center justify-center text-primary shrink-0">
                    <User size={20} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#1A1A1A] leading-tight">Edit Profile</h4>
                    <p className="text-[12px] text-[#6B6B6B] mt-1">Name, phone number, profile picture</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#9A9590]" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* PREFERENCES SECTION */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase mb-2 px-1">
              Preferences
            </h3>
            <div className="bg-white border-[1.5px] border-[#E8E4DC] rounded-[18px] shadow-[0px_2px_10px_0px_#0000000D] overflow-hidden divide-y-[1.5px] divide-[#E8E4DC]">

              {/* Push Notifications Row */}
              <div className="flex items-center justify-between p-5">
                <div>
                  <h4 className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Push Notifications</h4>
                  <p className="text-[12px] text-[#6B6B6B]">Payment alerts, reminders</p>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} size="lg" />
              </div>

              {/* End-to-end Firebase delivery check. The backend rejects
                  this with a useful message if this device has not yet
                  registered or server-side Firebase is unavailable. */}
              <button
                type="button"
                disabled={testNotification.isPending}
                onClick={() => testNotification.mutate()}
                className="w-full flex items-center justify-between p-5 text-left active:bg-[#FEFAF1]/80 transition-colors cursor-pointer outline-none disabled:cursor-wait disabled:opacity-60"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-[14px] bg-[#E4F2EB] flex items-center justify-center text-primary shrink-0">
                    <BellRing size={20} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Test Notification</h4>
                    <p className="text-[12px] text-[#6B6B6B] mt-1">Verify notifications on this device</p>
                  </div>
                </div>
                {testNotification.isPending ? (
                  <LoaderCircle size={18} className="text-primary animate-spin" />
                ) : (
                  <ChevronRight size={18} className="text-[#9A9590]" strokeWidth={2.5} />
                )}
              </button>

              {/* Auto Personal Reminders Row */}
              <div className="flex flex-col p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Auto Personal Reminders</h4>
                    <p className="text-[12px] text-[#6B6B6B]">Automatically remind people who owe you</p>
                  </div>
                  <Switch
                    checked={autoReminders}
                    onCheckedChange={(checked) => updateSettings.mutate({ auto_reminder_enabled: checked })}
                    size="lg"
                  />
                </div>

                {/* Collapsible auto reminder frequency sub-options */}
                <AnimatePresence initial={false}>
                  {autoReminders && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <span className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider block mb-2 mt-2 px-1">
                        Send reminder automatically:
                      </span>
                      <div className="border-[1.5px] border-[#E8E4DC] rounded-[13px] bg-[#F7F4EF] overflow-hidden divide-y-[1.5px] divide-[#E8E4DC]">

                        {/* Every week option */}
                        <button
                          type="button"
                          onClick={() => updateSettings.mutate({ auto_reminder_interval_days: 7 })}
                          className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors cursor-pointer outline-none"
                        >
                          <div className="flex items-center gap-3">
                            <Calendar size={18} className="text-[#6B6B6B]" />
                            <div>
                              <span className="text-[14px] font-semibold text-[#1A1A1A] block leading-none">Every week</span>
                              <span className="text-[11px] text-[#6B6B6B] block">Once every 7 days</span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {reminderInterval === 'week' ? (
                              <div className="w-5 h-5 rounded-full bg-positive text-white flex items-center justify-center">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-[#C0BAB2] bg-white" />
                            )}
                          </div>
                        </button>

                        {/* Every 2 weeks option */}
                        <button
                          type="button"
                          onClick={() => updateSettings.mutate({ auto_reminder_interval_days: 14 })}
                          className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors cursor-pointer outline-none"
                        >
                          <div className="flex items-center gap-3">
                            <Calendar size={18} className="text-[#6B6B6B]" />
                            <div>
                              <span className="text-[14px] font-semibold text-[#1A1A1A] block leading-none">Every 2 weeks</span>
                              <span className="text-[11px] text-[#6B6B6B] block">Once every 14 days</span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {reminderInterval === 'two_weeks' ? (
                              <div className="w-5 h-5 rounded-full bg-positive text-white flex items-center justify-center">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-[#C0BAB2] bg-white" />
                            )}
                          </div>
                        </button>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Currency Row 
              <CurrencySelectDrawer value={currency} onChange={setCurrency}>
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-5 text-left active:bg-[#FEFAF1]/80 transition-colors cursor-pointer border-0 bg-transparent outline-none"
                >
                  <div>
                    <h4 className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Currency</h4>
                    <p className="text-[12px] text-[#6B6B6B]">
                      {(() => {
                        const curObj = getCurrency(currency.toUpperCase())
                        return `${curObj.name} (${curObj.code})`
                      })()}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-[#9A9590]" strokeWidth={2.5} />
                </button>
              </CurrencySelectDrawer>
              */}

            </div>
          </div>

          {/* ACCOUNT ACTIONS SECTION */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase mb-2 px-1">
              Account Actions
            </h3>
            <div className="bg-white border border-[#EFE7DD] rounded-[18px] shadow-[0px_4.88px_24.38px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-[#F5EFE6]">

              {/* Log Out */}
              <button
                onClick={() => navigate({ to: ROUTES.USER_LOGOUT })}
                className="w-full flex items-center gap-4 p-5 text-left active:bg-[#FFF3E6]/80 transition-colors cursor-pointer outline-none"
              >
                <div className="w-11 h-11 rounded-[13px] bg-[#FFF3E6] flex items-center justify-center text-tertiary shrink-0">
                  <LogOut size={20} strokeWidth={2.2} />
                </div>
                <span className="text-[15px] font-semibold text-tertiary">Log Out</span>
              </button>

              {/* Report an Issue */}
              <button
                onClick={() => navigate({ to: ROUTES.USER_REPORT_ISSUE })}
                className="w-full flex items-center gap-4 p-5 text-left active:bg-[#FFF3E6]/80 transition-colors cursor-pointer outline-none"
              >
                <div className="w-11 h-11 rounded-[13px] bg-[#FFF3E6] flex items-center justify-center text-tertiary shrink-0">
                  <Info size={20} strokeWidth={2.2} />
                </div>
                <span className="text-[15px] font-semibold text-tertiary">Report an Issue</span>
              </button>

              {/* Delete Account */}
              <button
                onClick={() => navigate({ to: ROUTES.USER_DELETE_ACCOUNT })}
                className="w-full flex items-center gap-4 p-5 text-left active:bg-[#FFF3E6]/80 transition-colors cursor-pointer outline-none"
              >
                <div className="w-11 h-11 rounded-[13px] bg-[#FFF3E6] flex items-center justify-center text-tertiary shrink-0">
                  <Trash2 size={20} strokeWidth={2.2} />
                </div>
                <span className="text-[15px] font-semibold text-tertiary">Delete Account</span>
              </button>

            </div>
          </div>

        </div>
      </div>


    </div>
  )
}
