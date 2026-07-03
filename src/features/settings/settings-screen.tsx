import { useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  ChevronRight,
  User,
  Calendar,
  LogOut,
  Info,
  Trash2,
  Check,
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '@/store/use-auth-store'
import { ROUTES } from '@/constants/routes'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import FlowHeader from '@/components/shared/flow-header'
import { Switch } from '@/components/ui/switch'
import EditProfilePanel from './components/edit-profile-panel'
import ReportIssuePanel from './components/report-issue-panel'
import LogoutPanel from './components/logout-panel'
import DeleteAccountPanel from './components/delete-account-panel'

// ─── Main Screen Component ─────────────────────────────────────────────────────
export default function SettingsScreen() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/settings' }) as any
  const { userProfile, logout } = useAuthStore()

  // Local state for interactive settings mockup
  const [pushNotifications, setPushNotifications] = useState(true)
  const [autoReminders, setAutoReminders] = useState(true)
  const [reminderInterval, setReminderInterval] = useState<'week' | 'two_weeks'>('week')
  
  const isEditProfileOpen = search?.subPanel === 'edit-profile'
  const [isReportIssueOpen, setIsReportIssueOpen] = useState(false)
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false)

  // Toast message notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null)

  const showToast = (message: string, type: 'success' | 'info' = 'info') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 2500)
  }

  // Derive display values from store with mockup fallbacks
  const displayName = userProfile?.name || 'Muhammad Huzaifa'
  const displayPhone = userProfile?.phone || '+92 300 1234567'

  const initials = displayName
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)

  const handleLogout = () => {
    logout()
    navigate({ to: ROUTES.AUTH })
  }

  return (
    <div className="flex flex-col flex-1 pb-10 select-none relative">
      {/* Toast Alert overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-6 right-6 z-100 mx-auto max-w-[380px] bg-white/90 backdrop-blur-md border border-[#EFE7DD] shadow-[0px_10px_30px_rgba(0,0,0,0.08)] rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-[#E4F2EB] flex items-center justify-center text-[#0B683A] shrink-0">
              {toast.type === 'success' ? <Check size={16} strokeWidth={3} /> : <AlertCircle size={16} />}
            </div>
            <span className="text-sm font-semibold text-[#1A1A1A]">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
                onClick={() => (navigate as any)({ search: (prev: any) => ({ ...prev, subPanel: 'edit-profile' }) })}
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

              {/* Auto Personal Reminders Row */}
              <div className="flex flex-col p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Auto Personal Reminders</h4>
                    <p className="text-[12px] text-[#6B6B6B]">Automatically remind people who owe you</p>
                  </div>
                  <Switch checked={autoReminders} onCheckedChange={setAutoReminders} size="lg" />
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
                          onClick={() => setReminderInterval('week')}
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
                              <div className="w-5 h-5 rounded-full bg-[#0B683A] text-white flex items-center justify-center">
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
                          onClick={() => setReminderInterval('two_weeks')}
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
                              <div className="w-5 h-5 rounded-full bg-[#0B683A] text-white flex items-center justify-center">
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

              {/* Currency Row */}
              <button
                onClick={() => showToast('Currency settings are locked to PKR for this region.')}
                className="w-full flex items-center justify-between p-5 text-left active:bg-[#FEFAF1]/80 transition-colors cursor-pointer outline-none"
              >
                <div>
                  <h4 className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Currency</h4>
                  <p className="text-[12px] text-[#6B6B6B]">Pakistani Rupee (PKR)</p>
                </div>
                <ChevronRight size={18} className="text-[#9A9590]" strokeWidth={2.5} />
              </button>

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
                onClick={() => setIsLogoutOpen(true)}
                className="w-full flex items-center gap-4 p-5 text-left active:bg-[#FFF3E6]/80 transition-colors cursor-pointer outline-none"
              >
                <div className="w-11 h-11 rounded-[13px] bg-[#FFF3E6] flex items-center justify-center text-tertiary shrink-0">
                  <LogOut size={20} strokeWidth={2.2} />
                </div>
                <span className="text-[15px] font-semibold text-tertiary">Log Out</span>
              </button>

              {/* Report an Issue */}
              <button
                onClick={() => setIsReportIssueOpen(true)}
                className="w-full flex items-center gap-4 p-5 text-left active:bg-[#FFF3E6]/80 transition-colors cursor-pointer outline-none"
              >
                <div className="w-11 h-11 rounded-[13px] bg-[#FFF3E6] flex items-center justify-center text-tertiary shrink-0">
                  <Info size={20} strokeWidth={2.2} />
                </div>
                <span className="text-[15px] font-semibold text-tertiary">Report an Issue</span>
              </button>

              {/* Delete Account */}
              <button
                onClick={() => setIsDeleteAccountOpen(true)}
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

      {isEditProfileOpen && (
        <EditProfilePanel
          onClose={() => (navigate as any)({ search: (prev: any) => { const next = { ...prev }; delete next.subPanel; return next } })}
          onSuccess={(msg) => showToast(msg, 'success')}
        />
      )}

      {/* Report Issue sliding panel overlay */}
      {isReportIssueOpen && (
        <ReportIssuePanel
          onClose={() => setIsReportIssueOpen(false)}
          onSuccess={(msg) => showToast(msg, 'success')}
        />
      )}

      {/* Logout sliding panel overlay */}
      {isLogoutOpen && (
        <LogoutPanel
          onClose={() => setIsLogoutOpen(false)}
          onConfirm={handleLogout}
        />
      )}

      {/* Delete Account sliding panel overlay */}
      {isDeleteAccountOpen && (
        <DeleteAccountPanel
          onClose={() => setIsDeleteAccountOpen(false)}
          onConfirm={() => {
            setIsDeleteAccountOpen(false)
            showToast('Account deleted successfully.', 'success')
            setTimeout(() => {
              handleLogout()
            }, 1000)
          }}
        />
      )}
    </div>
  )
}
