import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from '@/components/ui/drawer'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'

interface PaidByDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (value: 'you' | 'contact') => void
  selectedValue: 'you' | 'contact'
  contactName: string
  contactInitials: string
  contactAvatarColor: string
}

export default function PaidByDrawer({
  isOpen,
  onClose,
  onSelect,
  selectedValue,
  contactName,
  contactInitials,
  contactAvatarColor,
}: PaidByDrawerProps) {
  // Temporary selection state until confirm is pressed
  const [tempValue, setTempValue] = useState<'you' | 'contact'>(selectedValue)

  useEffect(() => {
    if (isOpen) {
      setTempValue(selectedValue)
    }
  }, [isOpen, selectedValue])

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DrawerContent className="bg-white rounded-t-[32px] border-t-0 p-0 flex flex-col h-[90vh] max-h-[90vh] focus:outline-none overflow-hidden text-[#1A1A1A]">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0 relative">
          <DrawerClose asChild>
            <button
              type="button"
              className="size-8 rounded-full bg-[#FEFAF1] border border-[#EBEBEB] text-foreground flex items-center justify-center cursor-pointer hover:bg-muted/10 outline-none focus:outline-none"
            >
              <X size={16} className="text-[#6B6B6B]" />
            </button>
          </DrawerClose>
          <h3 className="text-lg font-extrabold text-[#1A1A1A] absolute left-1/2 -translate-x-1/2">Paid by</h3>
          <div className="size-8" />
        </div>

        <hr className="border-[#EBEBEB] border-b-[0.8px] w-full shrink-0" />

        {/* Sub-label text */}
        <div className="text-[13px] font-semibold text-[#9A9590] px-6 pt-4 text-left shrink-0">
          Who paid for this expense?
        </div>

        {/* Content Container */}
        <div className="flex-1 px-6 my-4 overflow-y-auto">
          <div className="bg-[#FDF8F4] rounded-[24px] border-[0.8px] border-[#EBEBEB] overflow-hidden shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EBEBEB] text-left">
            {/* Option: You */}
            <button
              type="button"
              onClick={() => setTempValue('you')}
              className={cn(
                'w-full flex items-center justify-between py-4.5 px-5 text-left border-0 cursor-pointer transition-colors outline-none',
                tempValue === 'you' ? 'bg-[#FFF9E6]' : 'bg-transparent'
              )}
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-10 shrink-0 font-extrabold text-sm text-white select-none">
                  <AvatarFallback className="rounded-full flex items-center justify-center border-0 text-white font-extrabold text-sm bg-[#0B683A]">
                    MH
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-sm text-[#1A1A1A] leading-tight">You (default)</span>
                  <span className="text-[11px] text-[#6B6B6B] font-medium mt-1 leading-none">Paid the full amount</span>
                </div>
              </div>
              {tempValue === 'you' && (
                <div className="w-6 h-6 rounded-full bg-[#0B683A] flex items-center justify-center text-white shrink-0">
                  <Check size={14} strokeWidth={3} className="text-white" />
                </div>
              )}
            </button>

            {/* Option: Contact */}
            <button
              type="button"
              onClick={() => setTempValue('contact')}
              className={cn(
                'w-full flex items-center justify-between py-4.5 px-5 text-left border-0 cursor-pointer transition-colors outline-none',
                tempValue === 'contact' ? 'bg-[#FFF9E6]' : 'bg-transparent'
              )}
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-10 shrink-0 font-extrabold text-sm text-white select-none">
                  <AvatarFallback className={cn("rounded-full flex items-center justify-center border-0 text-white font-extrabold text-sm", contactAvatarColor)}>
                    {contactInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-sm text-[#1A1A1A] leading-tight">{contactName}</span>
                  <span className="text-[11px] text-[#6B6B6B] font-medium mt-1 leading-none">Paid the full amount</span>
                </div>
              </div>
              {tempValue === 'contact' && (
                <div className="w-6 h-6 rounded-full bg-[#0B683A] flex items-center justify-center text-white shrink-0">
                  <Check size={14} strokeWidth={3} className="text-white" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Pinned Bottom CTA Bar */}
        <div className="px-6 py-5 bg-white shrink-0">
          <button
            type="button"
            onClick={() => {
              onSelect(tempValue)
              onClose()
            }}
            className="w-full h-14 rounded-full bg-[#0B683A] text-white font-extrabold text-base cursor-pointer shadow-[0px_4px_16px_0px_#F3C62373] hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
          >
            Confirm
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
