import { useState } from 'react'
import { Check, X, Banknote, CreditCard, Smile, Shield, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from '@/components/ui/drawer'

export type PaymentMethodType = 'cash' | 'bank' | 'easypaisa' | 'jazzcash' | 'other'

interface PaymentMethodDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (value: PaymentMethodType) => void
  selectedValue: PaymentMethodType
}

const METHODS = [
  {
    id: 'cash',
    title: 'Cash',
    subtitle: 'Paid in person',
    icon: Banknote,
    iconBg: 'bg-positive-soft-bg',
    iconColor: 'text-positive',
  },
  {
    id: 'bank',
    title: 'Bank Transfer',
    subtitle: 'IBFT / online transfer',
    icon: CreditCard,
    iconBg: 'bg-[#EFF6FF]',
    iconColor: 'text-[#2563EB]',
  },
  {
    id: 'easypaisa',
    title: 'Easypaisa',
    subtitle: 'Mobile wallet',
    icon: Smile,
    iconBg: 'bg-[#F0FDF4]',
    iconColor: 'text-[#16A34A]',
  },
  {
    id: 'jazzcash',
    title: 'JazzCash',
    subtitle: 'Mobile wallet',
    icon: Shield,
    iconBg: 'bg-[#FFF3E6]',
    iconColor: 'text-[#C85A00]',
  },
  {
    id: 'other',
    title: 'Other',
    subtitle: 'Cheque, crypto, etc.',
    icon: Upload,
    iconBg: 'bg-[#F5F5F5]',
    iconColor: 'text-muted-foreground',
  },
] as const

export default function PaymentMethodDrawer({
  isOpen,
  onClose,
  onSelect,
  selectedValue,
}: PaymentMethodDrawerProps) {
  // Bumped whenever isOpen transitions to true, forcing PaymentMethodDrawerContent to
  // remount with a fresh selectedValue - the idiomatic replacement for a "resync on open"
  // effect (see https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [openKey, setOpenKey] = useState(0)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) setOpenKey((k) => k + 1)
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DrawerContent className="bg-white rounded-t-[32px] border-t-0 p-0 flex flex-col focus:outline-none overflow-hidden text-foreground">
        <PaymentMethodDrawerContent
          key={openKey}
          onClose={onClose}
          onSelect={onSelect}
          selectedValue={selectedValue}
        />
      </DrawerContent>
    </Drawer>
  )
}

function PaymentMethodDrawerContent({
  onClose,
  onSelect,
  selectedValue,
}: Omit<PaymentMethodDrawerProps, 'isOpen'>) {
  const [tempValue, setTempValue] = useState<PaymentMethodType>(selectedValue)

  const selectedMethod = METHODS.find((m) => m.id === tempValue) || METHODS[0]

  return (
    <>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 shrink-0 flex items-start justify-between">
        <div className="flex flex-col text-left">
          <h3 className="text-[17px] font-bold text-foreground">Payment Method</h3>
          <span className="text-xs text-muted-foreground font-medium">
            How was this settled?
          </span>
        </div>
        <DrawerClose asChild>
          <button
            type="button"
            className="size-8 rounded-full bg-hover-bg flex items-center justify-center cursor-pointer outline-none focus:outline-none"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </DrawerClose>
      </div>

      <hr className="border-divider border-b-[0.8px] w-full shrink-0" />

      {/* Option list */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y-[1.5px]! divide-divider text-left">
          {METHODS.map((method) => {
            const isSelected = tempValue === method.id
            const IconComponent = method.icon

            return (
              <button
                key={method.id}
                type="button"
                onClick={() => setTempValue(method.id)}
                className={cn(
                  'w-full flex items-center justify-between py-4 px-6 text-left border-0 cursor-pointer transition-all outline-none',
                  isSelected ? 'bg-[#F5FBF7]' : 'bg-transparent'
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Method Icon Wrapper */}
                  <div className={cn('w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0', method.iconBg)}>
                    <IconComponent size={20} className={method.iconColor} />
                  </div>

                  <div className="flex flex-col text-left">
                    <span className={cn("font-semibold text-[15px] text-foreground leading-tight", isSelected ? "text-positive" : "")}>
                      {method.title}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal mt-1 leading-none">
                      {method.subtitle}
                    </span>
                  </div>
                </div>

                {/* Custom Radio check dot indicator */}
                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-positive flex items-center justify-center text-white shrink-0 shadow-sm animate-in zoom-in-75 duration-150">
                    <Check size={13} strokeWidth={3} className="text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-divider bg-white shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Pinned Bottom Confirm Button */}
      <div className="px-6 py-5 bg-white shrink-0 border-t-[1.5px] border-divider">
        <button
          type="button"
          onClick={() => {
            onSelect(tempValue)
            onClose()
          }}
          className="w-full h-14 rounded-full bg-secondary text-white font-bold text-15px cursor-pointer active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
        >
          Confirm {selectedMethod.title}
        </button>
      </div>
    </>
  )
}
