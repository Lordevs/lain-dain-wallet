import { X } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerClose,
} from '@/components/ui/drawer'

interface ConfirmActionDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  confirmTitle: string
  confirmDescription: string
  buttonText?: string
  onConfirm: () => void
}

export default function ConfirmActionDrawer({
  isOpen,
  onClose,
  title,
  confirmTitle,
  confirmDescription,
  buttonText = 'Confirm',
  onConfirm,
}: ConfirmActionDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-[32px] pb-9 border-t-0 h-[50vh] max-h-[50vh]">
        <DrawerHeader className="flex-row items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-[17px] font-bold text-[#1A1A1A] text-left">
            {title}
          </h3>
          <DrawerClose asChild>
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-[#F5F5F5] text-[#6B6B6B] flex items-center justify-center cursor-pointer active:scale-95 transition-all outline-none border-0 shrink-0"
              aria-label="Close"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </DrawerClose>
        </DrawerHeader>
        <hr className="border-b-[1.5px] border-[#EBEBEB] w-full shrink-0 mb-6" />

        <div className="flex-1 flex flex-col justify-between px-6 text-left">
          <div>
            <h4 className="text-[18px] font-bold text-[#C96A1B] mt-1 leading-snug">
              {confirmTitle}
            </h4>
            <p className="text-[14.5px] text-[#6B6B6B] mt-2.5 leading-relaxed font-medium">
              {confirmDescription}
            </p>
          </div>

          {/* Bottom CTA */}
          <div className="mt-20">
            <button
              type="button"
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className="w-full h-14 bg-tertiary text-white rounded-full font-bold text-[17px] flex items-center justify-center active:scale-[0.99] transition-all cursor-pointer shadow-[0px_3px_12px_0px_#0B683A47]"
            >
              {buttonText}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
