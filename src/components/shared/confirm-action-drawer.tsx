import { X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerClose,
} from '@/components/ui/drawer'

// ─── Button Variants ──────────────────────────────────────────────────────────
const confirmButtonVariants = cva(
  // Base styles shared by all variants
  'w-full h-14 text-white rounded-full font-bold text-base flex items-center justify-center active:scale-[0.99] transition-all cursor-pointer border-0 outline-none',
  {
    variants: {
      variant: {
        /** Default — used for leave/remove confirmations */
        warning: 'bg-orange-payable hover:bg-orange-payable/95',
        /** Destructive — used for delete group */
        danger: 'bg-[#EB5757] hover:bg-[#EB5757]/95',
        /** Primary — used for general confirm actions */
        primary: 'bg-positive hover:bg-positive/95',
      },
    },
    defaultVariants: { variant: 'warning' },
  }
)

interface ConfirmActionDrawerProps extends VariantProps<typeof confirmButtonVariants> {
  isOpen: boolean
  onClose: () => void
  title: string
  confirmTitle: string
  confirmDescription: string
  buttonText?: string
  /** @deprecated Pass `variant` instead of a raw className string */
  buttonClassName?: string
  onConfirm: () => void
  /** Keep the drawer open while an async action is being verified. */
  closeOnConfirm?: boolean
  disabled?: boolean
}

export default function ConfirmActionDrawer({
  isOpen,
  onClose,
  title,
  confirmTitle,
  confirmDescription,
  buttonText = 'Confirm',
  variant,
  buttonClassName,
  onConfirm,
  closeOnConfirm = true,
  disabled = false,
}: ConfirmActionDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-[32px] pb-8 border-t-0 h-auto max-h-[90vh] text-left text-foreground outline-none">
        {/* Drawer Header */}
        <DrawerHeader className="relative flex items-center justify-center px-14 pt-4 pb-4 shrink-0 text-center">
          <h3 className="text-[17px] font-extrabold text-foreground leading-snug max-w-[280px]">
            {title}
          </h3>
          <DrawerClose asChild>
            <button
              type="button"
              className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#F5F5F5] text-muted-foreground flex items-center justify-center cursor-pointer active:scale-95 transition-all outline-none border-0 shrink-0"
              aria-label="Close"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </DrawerClose>
        </DrawerHeader>
        <hr className="border-divider border-b-[0.8px] w-full shrink-0" />

        {/* Content Area */}
        <div className="flex flex-col px-6 pt-6 pb-2">
          <div className="space-y-3.5">
            <h4 className="text-[18px] font-black text-orange-payable leading-snug">
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
              disabled={disabled}
              onClick={() => {
                onConfirm()
                if (closeOnConfirm) onClose()
              }}
              // buttonClassName is kept for backward compat but variant is preferred
              className={buttonClassName ?? `${confirmButtonVariants({ variant })} disabled:opacity-60 disabled:cursor-not-allowed`}
              aria-label={buttonText}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
