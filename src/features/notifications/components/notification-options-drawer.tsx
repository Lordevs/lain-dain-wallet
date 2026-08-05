import { X, CheckCheck, Trash2 } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerClose } from '@/components/ui/drawer'

interface NotificationOptionsDrawerProps {
  isOpen: boolean
  onClose: () => void
  hasUnread: boolean
  onMarkAllReadClick: () => void
  onClearAllClick: () => void
}

/** Options menu behind the notifications screen's 3-dot button — mirrors
 * CategoryOptionsDrawer's row markup/coloring for consistency with the
 * app's one other "options drawer" pattern. */
export default function NotificationOptionsDrawer({
  isOpen,
  onClose,
  hasUnread,
  onMarkAllReadClick,
  onClearAllClick,
}: NotificationOptionsDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-[32px] pb-8 border-t-0 text-[#1A1A1A] outline-none">
        <DrawerHeader className="relative flex items-center justify-center px-14 pt-4 pb-4 shrink-0 text-center">
          <h3 className="text-[17px] font-extrabold text-foreground leading-snug">
            Notifications
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
        <hr className="border-[#EBEBEB] border-b-[0.8px] w-full shrink-0" />

        <div className="divide-y-[0.8px]! divide-[#EBEBEB] flex flex-col">
          {hasUnread && (
            <button
              type="button"
              onClick={() => {
                onMarkAllReadClick()
                onClose()
              }}
              className="w-full py-4 px-6 flex items-center gap-4 hover:bg-muted/5 transition-colors cursor-pointer border-0 bg-transparent text-left outline-none"
            >
              <div className="w-10 h-10 rounded-[12px] bg-[#E4F2EB] text-positive flex items-center justify-center shrink-0">
                <CheckCheck size={18} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Mark all read</span>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClearAllClick()
              onClose()
            }}
            className="w-full py-4 px-6 flex items-center gap-4 hover:bg-muted/5 transition-colors cursor-pointer border-0 bg-transparent text-left outline-none"
          >
            <div className="w-10 h-10 rounded-[12px] bg-[#FDF3F3] text-[#C0392B] flex items-center justify-center shrink-0">
              <Trash2 size={18} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-[#C0392B] leading-tight">Clear all</span>
              <span className="text-[12px] font-normal text-[#6B6B6B] mt-0.5 leading-none">Remove every notification</span>
            </div>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
