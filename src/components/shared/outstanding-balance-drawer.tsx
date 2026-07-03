import { AlertTriangle, X } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerClose,
} from '@/components/ui/drawer'

interface OutstandingBalanceDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  warningTitle?: string
  warningText: string
  buttonText?: string
  onAction: () => void
}

export default function OutstandingBalanceDrawer({
  isOpen,
  onClose,
  title,
  warningTitle = 'Outstanding balance',
  warningText,
  buttonText = 'Settle Balance',
  onAction,
}: OutstandingBalanceDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-[32px] pb-9 border-t-0 h-auto max-h-[90vh]">
        <DrawerHeader className="flex-row items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-[17px] font-bold text-foreground text-left">
            {title}
          </h3>
          <DrawerClose asChild>
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-[#F5F5F5] text-muted-foreground flex items-center justify-center cursor-pointer active:scale-95 transition-all outline-none border-0 shrink-0"
              aria-label="Close"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </DrawerClose>
        </DrawerHeader>
        <hr className="border-divider border-b-[0.8px] w-full shrink-0" />

        <div className="flex flex-col px-6 pt-6 pb-2">
          {/* Warning box */}
          <div className="w-full bg-[#FFF9E6] border-[1.11px] border-[#C85A0033] rounded-[20px] p-5 pb-10 text-left shadow-[0px_2px_8px_0px_rgba(253,177,5,0.03)]">
            <div className='flex items-center gap-2 mb-2'>
              <AlertTriangle size={18} className="text-tertiary shrink-0" />
              <h4 className="text-[15px] font-bold text-tertiary leading-none">
                {warningTitle}
              </h4>
            </div>
            <p className="text-[18px] text-muted-foreground font-normal">
              {warningText}
            </p>
          </div>

          {/* Bottom CTA */}
          <div className="mt-10">
            <button
              type="button"
              onClick={() => {
                onAction()
                onClose()
              }}
              className="w-full h-14 bg-secondary text-white rounded-full font-bold text-[17px] flex items-center justify-center active:scale-[0.99] transition-all cursor-pointer"
            >
              {buttonText}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
