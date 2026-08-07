import { useState } from 'react'
import { Trash2, X, Info } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import FlowHeader from '@/components/shared/flow-header'
import OutstandingBalanceDrawer from '@/components/shared/outstanding-balance-drawer'
import ConfirmActionDrawer from '@/components/shared/confirm-action-drawer'
import { useAuthStore } from '@/store/use-auth-store'
import { clearRefreshToken } from '@/lib/secure-storage'
import { useDeleteAccountMutation } from '@/features/auth/api/use-auth-mutations'
import { queryClient } from '@/lib/query-client'
import { ROUTES } from '@/constants/routes'

interface DeleteAccountPanelProps {
  onClose?: () => void
  onConfirm?: () => void
}

export default function DeleteAccountPanel({
  onClose = () => window.history.back(),
  onConfirm,
}: DeleteAccountPanelProps) {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const deleteAccount = useDeleteAccountMutation()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  // Only known to be an outstanding-balance block once the backend actually
  // says so (delete_account settles/leaves everything it safely can and
  // only then rejects) — never guessed client-side ahead of time. Holds
  // the real message (names the friend/group and amount) so this drawer
  // never shows a generic "you have a balance" that might not even be true.
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)

  const handleConfirm =
    onConfirm ??
    (() => {
      deleteAccount.mutate(undefined, {
        onSuccess: async () => {
          // Whoever signs in next on this same device — including this
          // exact phone number, re-registered as a brand new account —
          // would otherwise inherit this account's cached data: most
          // query keys in this app don't include a user id, so without
          // clearing the cache here, screens like the contacts picker
          // could show stale results (or a stale empty result) instead
          // of the new account's own.
          await clearRefreshToken()
          queryClient.clear()
          logout()
          navigate({ to: ROUTES.AUTH })
        },
        onError: (err) => setBlockedMessage(err.message),
      })
    })

  return (
    <div className="min-h-screen bg-[#FEFAF1] flex flex-col select-none overflow-y-auto text-[#1A1A1A]">
      <FlowHeader
        title="Delete Account"
        onBack={onClose}
      />

      <div className="flex-1 flex flex-col justify-between px-6 pb-10 pt-2">
        <div className="flex flex-col items-center text-center mt-[76px]">
          {/* Large Trash Icon circle wrapper with soft glow */}
          <div className="w-[110px] h-[110px] rounded-full bg-[#FFF0EE] shadow-[0px_6px_20px_0px_#C0392B2E] flex items-center justify-center text-tertiary shrink-0">
            <Trash2 size={40} strokeWidth={2} />
          </div>

          <h2 className="text-[22px] font-extrabold! text-[#1A1A1A] mt-8 tracking-tight leading-tight">
            Delete your account?
          </h2>
          <p className="text-[14px] text-[#6B6B6B] mt-3.5 max-w-[320px] leading-relaxed">
            This action is <span className="font-bold">permanent</span> and cannot be undone. All your data will be erased.
          </p>

          {/* Warnings List Card */}
          <div className="w-full bg-[#FFF0EE] border border-tertiary rounded-[14px] p-5 text-left mt-8 shadow-[0px_2px_8px_0px_rgba(200,90,0,0.05)]">
            <h3 className="text-[12px] font-bold text-tertiary uppercase tracking-widest mb-2">
              What will be deleted
            </h3>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-3">
                <X size={16} className="text-tertiary mt-0.5 shrink-0 stroke-[2.5px]" />
                <span className="text-[13px] text-[#1A1A1A] font-medium leading-snug">
                  Your profile and account data
                </span>
              </li>
              <li className="flex items-start gap-3">
                <X size={16} className="text-tertiary mt-0.5 shrink-0 stroke-[2.5px]" />
                <span className="text-[13px] text-[#1A1A1A] font-medium leading-snug">
                  All personal ledger entries
                </span>
              </li>
              <li className="flex items-start gap-3">
                <X size={16} className="text-tertiary mt-0.5 shrink-0 stroke-[2.5px]" />
                <span className="text-[13px] text-[#1A1A1A] font-medium leading-snug">
                  Transaction history
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Info size={16} className="text-tertiary mt-0.5 shrink-0 stroke-[2.2px]" />
                <span className="text-[13px] text-[#1A1A1A] font-medium leading-snug">
                  Group expenses will remain visible to other members
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3.5 mt-8">
          {/* Permanently Delete Button */}
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            disabled={deleteAccount.isPending}
            className="w-full h-14 bg-tertiary text-white rounded-[16px] font-bold text-[17px] flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer shadow-[0px_4px_14px_0px_#C0392B4D] disabled:opacity-70"
          >
            <Trash2 size={17} strokeWidth={2.5} />
            {deleteAccount.isPending ? 'Deleting...' : 'Permanently Delete'}
          </button>

          {/* Keep My Account Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full h-14 bg-white border-[1.6px] border-[#EBEBEB] text-[#6B6B6B] rounded-[16px] font-bold text-[17px] flex items-center justify-center active:scale-[0.99] transition-all cursor-pointer"
          >
            Keep My Account
          </button>
        </div>
      </div>

      {/* Shown only after the backend actually rejects deletion for an
          outstanding balance — warningText is its real error message. */}
      <OutstandingBalanceDrawer
        isOpen={!!blockedMessage}
        onClose={() => setBlockedMessage(null)}
        title="Permanently delete the Account"
        warningText={blockedMessage ?? ''}
        buttonText="Got it"
        onAction={() => setBlockedMessage(null)}
      />

      <ConfirmActionDrawer
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Permanently delete the Account"
        confirmTitle="Delete your account permanently?"
        confirmDescription="This will erase everything — your profile, all entries, transaction history, and personal balances. This cannot be undone."
        onConfirm={handleConfirm}
      />
    </div>
  )
}
