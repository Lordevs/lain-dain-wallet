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
  buttonClassName?: string
  onConfirm: () => void
}

export default function ConfirmActionDrawer({
  isOpen,
  onClose,
  title,
  confirmTitle,
  confirmDescription,
  buttonText = 'Confirm',
  buttonClassName,
  onConfirm,
}: ConfirmActionDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-[32px] pb-8 border-t-0 h-auto max-h-[90vh] text-left text-[#1A1A1A] outline-none">
        {/* Grab Handle */}
        <div className="mx-auto mt-3.5 h-1.5 w-12 rounded-full bg-[#E5E0DA] shrink-0" />

        {/* Drawer Header */}
        <DrawerHeader className="relative flex items-center justify-center px-14 pt-4 pb-4 shrink-0 text-center">
          <h3 className="text-[17px] font-extrabold text-[#1A1A1A] leading-snug max-w-[280px]">
            {title}
          </h3>
          <DrawerClose asChild>
            <button
              type="button"
              className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#F5F5F5] text-[#6B6B6B] flex items-center justify-center cursor-pointer active:scale-95 transition-all outline-none border-0 shrink-0"
              aria-label="Close"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </DrawerClose>
        </DrawerHeader>
        <hr className="border-[#EBEBEB] border-b-[0.8px] w-full shrink-0" />

        {/* Content Area */}
        <div className="flex flex-col px-6 pt-6 pb-2">
          <div className="space-y-3.5">
            <h4 className="text-[18px] font-black text-[#C96A1B] leading-snug">
              {confirmTitle}
            </h4>
            <p className="text-[15px] text-[#555555] font-semibold leading-relaxed">
              {confirmDescription}
            </p>
          </div>

          {/* Confirm Button CTA */}
          <div className="mt-10">
            <button
              type="button"
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={buttonClassName || "w-full h-14 bg-[#C96A1B] hover:bg-[#C96A1B]/95 text-white rounded-full font-bold text-base flex items-center justify-center active:scale-[0.99] transition-all cursor-pointer shadow-[0px_8px_20px_rgba(201,106,27,0.25)] border-0 outline-none"}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
