import { useParams, useNavigate } from '@tanstack/react-router'
import { ChevronRight, Users, Triangle, Smile, Layers, MoreVertical } from 'lucide-react'
import { MOCK_RECEIVABLES, MOCK_PAYABLES } from '@/features/dashboard/data/mock-data'
import ContactAvatar from '@/components/shared/contact-avatar'
import NetBalanceCard from './components/net-balance-card'
import { ROUTES } from '@/constants/routes'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'

/**
 * ContactDetailScreen — displays detailed breakdown of ledgers for a selected contact.
 * Includes back button, avatar, overall stat card, and list of ledger tags.
 */
export default function ContactDetailScreen() {
  const { id } = useParams({ from: '/contacts/$id' })
  const navigate = useNavigate()

  // Find contact by id from mock data
  const contact = [...MOCK_RECEIVABLES, ...MOCK_PAYABLES].find((c) => c.id === id)

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#FEFAF1]">
        <p className="text-muted-foreground text-sm mb-4">Contact not found</p>
        <button
          onClick={() => navigate({ to: ROUTES.DASHBOARD })}
          className="text-primary font-bold hover:underline border-0 bg-transparent cursor-pointer"
        >
          Go Back
        </button>
      </div>
    )
  }

  // Helper to resolve icon and colors for ledger tags
  const getLedgerVisuals = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('1-to-1') || lowerName.includes('personal')) {
      return {
        icon: <Users size={20} className="text-[#1F618D]" />,
        bgClass: 'bg-[#E3F2FD]',
      }
    }
    if (lowerName.includes('trip') || lowerName.includes('murree')) {
      return {
        icon: <Triangle size={18} className="text-[#0B683A] fill-[#0B683A]/10" strokeWidth={2.5} />,
        bgClass: 'bg-[#E8F5E9]',
      }
    }
    if (lowerName.includes('poker') || lowerName.includes('game') || lowerName.includes('grocery')) {
      return {
        icon: <Smile size={20} className="text-[#C96A1B]" />,
        bgClass: 'bg-[#FFF3E6]',
      }
    }
    return {
      icon: <Layers size={20} className="text-[#9A9590]" />,
      bgClass: 'bg-[#F5F3ED]',
    }
  }

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen">
      {/* Unified Header */}
      <FlowHeader
        title={contact.name}
        subtitle={contact.type === 'group' ? '6 members' : 'Personal Balance'}
        onBack={() => navigate({ to: ROUTES.DASHBOARD })}
        backVariant="minimal"
        avatar={
          <div className="relative shrink-0 flex items-center">
            <ContactAvatar
              initials={contact.initials}
              avatarColor={contact.avatarColor}
              size="md"
              className="size-11 text-sm font-bold"
            />
            {contact.isOnline && (
              <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#14A558] border border-[#FEFAF1] rounded-full" />
            )}
          </div>
        }
        rightSlot={
          contact.type === 'group' ? (
            <button className="text-[#6B6B6B] cursor-pointer border-0 bg-transparent flex items-center justify-center p-2">
              <MoreVertical size={20} />
            </button>
          ) : undefined
        }
      />

      {/* Overall Balance Stat Card */}
      <div className="px-6 mb-6">
        <NetBalanceCard
          amount={contact.netAmount}
          description={`Net across ${contact.ledgerCount} ledger${contact.ledgerCount !== 1 ? 's' : ''}`}
        />
      </div>

      {/* Ledger Breakdown Title */}
      <h2 className="text-[17px] font-bold text-[#1A1A1A] px-6 mb-3">
        Breakdown by ledger
      </h2>

      {/* Ledger Breakdown List */}
      <div className="px-6 pb-8">
        <div className="bg-white rounded-[24px] border border-[#EFE7DD] overflow-hidden shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EFE7DD]">
          {contact.tags.map((tag, i) => {
            const { icon, bgClass } = getLedgerVisuals(tag.name)
            const isReceivable = tag.amount > 0
            const subtitle = isReceivable
              ? `${contact.name.split(' ')[0]} owes you`
              : `You owe ${contact.name.split(' ')[0]}`

            // Format tag amount
            let formattedTagAmount = formatCurrency(Math.abs(tag.amount), 'PKR')
            formattedTagAmount = formattedTagAmount.replace('₨', 'Rs.')

            return (
              <div
                key={`${tag.name}-${i}`}
                className="flex items-center justify-between p-4 bg-white hover:bg-muted/5 transition-all"
              >
                {/* Left side details */}
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bgClass)}>
                    {icon}
                  </div>
                  <div>
                    <p className="font-bold text-[15px] text-[#1A1A1A] leading-tight">
                      {tag.name}
                    </p>
                    <p className="text-[12px] text-[#9A9590] mt-1 font-semibold leading-none">
                      {subtitle}
                    </p>
                  </div>
                </div>

                {/* Right side amount + chevron */}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-[16px] font-extrabold',
                      isReceivable ? 'text-[#0B683A]' : 'text-[#C96A1B]'
                    )}
                  >
                    {formattedTagAmount}
                  </span>
                  <ChevronRight size={16} className="text-[#9A9590]" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
