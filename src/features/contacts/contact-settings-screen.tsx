import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import {
  Ban,
  CalendarDays,
  ChevronRight,
  FileText,
  Phone,
  RefreshCcw,
  Trash2,
} from 'lucide-react'
import FlowHeader from '@/components/shared/flow-header'
import ContactAvatar from '@/components/shared/contact-avatar'
import ConfirmActionDrawer from '@/components/shared/confirm-action-drawer'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { ROUTES } from '@/constants/routes'
import { initialsForName, colorForName } from '@/lib/avatar-visuals'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { useContactLedgers } from './hooks/use-contact-ledgers'
import { useFriendshipBalanceQuery } from './api/use-friendship-balance-query'
import { useFriendshipDetailQuery } from './api/use-friendship-detail-query'
import {
  useBlockFriendshipMutation,
  useClearFriendshipHistoryMutation,
  useUnblockFriendshipMutation,
  useUpdateFriendshipExchangeRateMutation,
} from './api/use-friendship-settings-mutations'
import ExchangeRateDrawer from './components/exchange-rate-drawer'

interface SettingsRowProps {
  icon?: ReactNode
  title: ReactNode
  description: ReactNode
  action?: ReactNode
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
}

function SettingsRow({
  icon,
  title,
  description,
  action,
  onClick,
  danger = false,
  disabled = false,
}: SettingsRowProps) {
  const isInteractive = !!onClick && !disabled
  return (
    <Item
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={isInteractive ? (event) => event.key === 'Enter' && onClick() : undefined}
      className={cn(
        'rounded-none border-0 flex-nowrap gap-4 px-5 py-[18px] bg-white',
        isInteractive && 'cursor-pointer hover:bg-[#FEFAF1]/70',
        disabled && 'opacity-45 cursor-not-allowed',
      )}
    >
      {icon && (
        <ItemMedia
          className={cn(
            'size-12 rounded-[14px] flex items-center justify-center self-center',
            danger ? 'bg-[#FFF0ED] text-[#CC3428]' : 'bg-[#E8F4EF] text-positive',
          )}
        >
          {icon}
        </ItemMedia>
      )}
      <ItemContent className="min-w-0 gap-1">
        <ItemTitle className={cn('text-[16px] font-bold leading-tight', danger ? 'text-[#CC3428]' : 'text-[#1A1A1A]')}>
          {title}
        </ItemTitle>
        <ItemDescription className="text-[13px] text-[#73706D] leading-snug line-clamp-2">
          {description}
        </ItemDescription>
      </ItemContent>
      {action && <ItemActions className="shrink-0">{action}</ItemActions>}
    </Item>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <h2 className="text-[12px] font-bold text-[#77736F] tracking-[0.08em] uppercase mb-2 px-0.5">
        {title}
      </h2>
      <div className="bg-white border border-[#E7E4DE] rounded-[22px] shadow-[0_3px_12px_rgba(26,26,26,0.045)] divide-y divide-[#E7E4DE] overflow-hidden">
        {children}
      </div>
    </section>
  )
}

export default function ContactSettingsScreen() {
  const { id: userId } = useParams({ from: '/contacts/$id/settings' })
  const navigate = useNavigate({ from: '/contacts/$id/settings' })
  const ledgers = useContactLedgers(userId)
  const friendshipId = ledgers.friendshipId
  const friendshipQuery = useFriendshipDetailQuery(friendshipId)
  const balanceQuery = useFriendshipBalanceQuery(friendshipId)

  const [autoReminders, setAutoReminders] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [showExchangeRate, setShowExchangeRate] = useState(false)
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const blockMutation = useBlockFriendshipMutation(friendshipId ?? '')
  const unblockMutation = useUnblockFriendshipMutation(friendshipId ?? '')
  const clearMutation = useClearFriendshipHistoryMutation(friendshipId ?? '')
  const exchangeRateMutation = useUpdateFriendshipExchangeRateMutation(friendshipId ?? '')

  const friendship = friendshipQuery.data
  const balance = balanceQuery.data?.[0]
  const friend = friendship?.friend
  const ledgerCurrency = friendship?.currency ?? friendship?.your_currency ?? balance?.currency ?? 'PKR'
  const hasDifferentCurrencies =
    !!friendship
    && friendship.your_currency !== friendship.friend_currency
  const otherCurrency = ledgerCurrency === friendship?.your_currency
    ? friendship?.friend_currency
    : friendship?.your_currency

  if (ledgers.isLoading || friendshipQuery.isLoading || balanceQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[#FEFAF1]">
        <FlowHeader title="Ledger Settings" backVariant="circle" />
        <div className="px-6 pt-6 space-y-5">
          <Skeleton className="size-24 rounded-full mx-auto" />
          <Skeleton className="h-8 w-44 mx-auto" />
          <Skeleton className="h-16 w-full rounded-[18px]" />
          <Skeleton className="h-36 w-full rounded-[22px]" />
          <Skeleton className="h-60 w-full rounded-[22px]" />
        </div>
      </div>
    )
  }

  if (!friendship || !friend || ledgers.isError || friendshipQuery.isError) {
    return (
      <div className="min-h-screen bg-[#FEFAF1] flex flex-col">
        <FlowHeader title="Ledger Settings" backVariant="circle" />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="text-sm text-muted-foreground">Couldn’t load ledger settings.</p>
          <button
            type="button"
            onClick={() => navigate({ to: ROUTES.CONTACT_DETAILS, params: { id: userId } })}
            className="mt-4 text-positive font-bold bg-transparent border-0 cursor-pointer"
          >
            Return to ledger
          </button>
        </div>
      </div>
    )
  }

  const balanceAmount = Number(balance?.net_amount ?? 0)
  const balanceLabel = balance?.direction === 'owed_to_you'
    ? `${friend.full_name.split(' ')[0]} owes you`
    : balance?.direction === 'you_owe'
      ? `You owe ${friend.full_name.split(' ')[0]}`
      : 'You are settled'
  const isBlocked = friendship.is_blocked
  const canUnblock = isBlocked && friendship.blocked_by_me
  const isActionPending = blockMutation.isPending || unblockMutation.isPending
  const createdDate = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(friendship.created_at))

  return (
    <div className="min-h-screen bg-[#FEFAF1] pb-10 text-left">
      <FlowHeader
        title="Ledger Settings"
        backVariant="circle"
        onBack={() => navigate({ to: ROUTES.CONTACT_DETAILS, params: { id: userId } })}
      />

      <main className="px-6 pt-3 space-y-7">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <ContactAvatar
              initials={initialsForName(friend.full_name)}
              avatarColor={colorForName(friend.full_name)}
              src={friend.image ?? undefined}
              size="lg"
              className="size-24 shadow-[0_6px_18px_rgba(26,26,26,0.10)]"
            />
            {!isBlocked && (
              <span className="absolute right-0.5 bottom-1 size-4 rounded-full bg-[#2AC978] border-[3px] border-[#FEFAF1]" />
            )}
          </div>
          <h1 className="text-[22px] font-extrabold text-[#1A1A1A] mt-4 leading-tight">
            {friend.full_name}
          </h1>
          <p className="text-[14px] text-[#6F6C69] mt-1">Personal · 1-to-1 Ledger</p>
        </div>

        <div className="min-h-16 rounded-[18px] bg-[#E5F2ED] border border-[#B9DBCF] flex items-center justify-center gap-2 px-5 text-center">
          <span className="text-[14px] font-semibold text-[#686D69]">{balanceLabel}</span>
          <strong className="text-[21px] font-extrabold text-positive">
            {formatCurrency(balanceAmount, balance?.currency ?? ledgerCurrency)}
          </strong>
        </div>

        <Section title="Ledger actions">
          <SettingsRow
            icon={<RefreshCcw size={22} strokeWidth={2} />}
            title={
              <>
                Recurring Payment
              </>
            }
            description={`Set a monthly or weekly split with ${friend.full_name.split(' ')[0]}`}
            action={<ChevronRight size={18} className="text-[#73706D]" />}
            disabled={isBlocked}
            onClick={isBlocked
              ? undefined
              : () => navigate({ to: ROUTES.CONTACT_RECURRING, params: { id: userId } })}
          />
        </Section>

        <Section title="Preferences">
          <SettingsRow
            title="Auto Reminders"
            description={`Remind ${friend.full_name.split(' ')[0]} automatically if overdue`}
            action={
              <Switch
                checked={autoReminders}
                onCheckedChange={setAutoReminders}
                size="lg"
                aria-label="Auto reminders"
              />
            }
          />
          <SettingsRow
            title="Notifications"
            description={`Payment updates from ${friend.full_name.split(' ')[0]}`}
            action={
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
                size="lg"
                aria-label="Notifications"
              />
            }
          />
          <SettingsRow
            title="Currency"
            description={
              hasDifferentCurrencies
                ? `1 ${otherCurrency} = ${friendship.exchange_rate ?? '—'} ${ledgerCurrency}`
                : 'Shared currency for this ledger'
            }
            action={
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-[#73706D]">{ledgerCurrency}</span>
                {hasDifferentCurrencies && <ChevronRight size={18} className="text-[#73706D]" />}
              </div>
            }
            onClick={hasDifferentCurrencies ? () => setShowExchangeRate(true) : undefined}
          />
        </Section>

        <Section title="Person info">
          <SettingsRow
            icon={<Phone size={22} strokeWidth={2} />}
            title="Phone"
            description={friend.phone_number}
          />
          <SettingsRow
            icon={<CalendarDays size={22} strokeWidth={2} />}
            title="Ledger started"
            description={createdDate}
          />
          <SettingsRow
            icon={<FileText size={22} strokeWidth={2} />}
            title="Total entries"
            description={`${friendship.total_entries} ${friendship.total_entries === 1 ? 'entry' : 'entries'} across all time`}
          />
        </Section>

        <Section title="Danger zone">
          <SettingsRow
            icon={<Ban size={22} strokeWidth={2} />}
            title={canUnblock
              ? `Unblock ${friend.full_name}`
              : isBlocked
                ? `Blocked by ${friend.full_name}`
                : `Block ${friend.full_name}`}
            description={canUnblock
              ? 'Allow new activity with this person'
              : isBlocked
                ? 'Only the person who blocked this ledger can unblock it'
                : 'Stop all new activity with this person'}
            action={!isBlocked || canUnblock
              ? <ChevronRight size={18} className="text-[#D7D4CF]" />
              : undefined}
            danger
            disabled={isBlocked && !canUnblock}
            onClick={canUnblock
              ? () => unblockMutation.mutate()
              : isBlocked
                ? undefined
                : () => setShowBlockConfirm(true)}
          />
          <SettingsRow
            icon={<Trash2 size={22} strokeWidth={2} />}
            title="Clear Ledger History"
            description="Delete all entries — cannot be undone"
            action={<ChevronRight size={18} className="text-[#D7D4CF]" />}
            danger
            onClick={() => setShowClearConfirm(true)}
          />
        </Section>
      </main>

      <ExchangeRateDrawer
        isOpen={showExchangeRate}
        onClose={() => setShowExchangeRate(false)}
        ledgerCurrency={ledgerCurrency}
        otherCurrency={otherCurrency ?? friendship.friend_currency}
        currentRate={friendship.exchange_rate}
        isSubmitting={exchangeRateMutation.isPending}
        error={exchangeRateMutation.error?.message}
        onConfirm={(rate) => {
          exchangeRateMutation.mutate(rate, {
            onSuccess: () => setShowExchangeRate(false),
          })
        }}
      />

      <ConfirmActionDrawer
        isOpen={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        title={`Block ${friend.full_name}?`}
        confirmTitle="Stop new ledger activity"
        confirmDescription="Existing history stays visible, but neither person can add new expenses, payments, or recurring entries until the ledger is unblocked."
        buttonText={isActionPending ? 'Blocking…' : 'Block'}
        variant="danger"
        onConfirm={() => blockMutation.mutate()}
      />

      <ConfirmActionDrawer
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear Ledger History?"
        confirmTitle="This affects both people"
        confirmDescription="All expenses, payments, and recurring entries in this 1-to-1 ledger will be permanently removed. This cannot be undone."
        buttonText={clearMutation.isPending ? 'Clearing…' : 'Clear history'}
        variant="danger"
        onConfirm={() => clearMutation.mutate()}
      />
    </div>
  )
}
