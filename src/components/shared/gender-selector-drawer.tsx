import { useState } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GenderSelectorDrawerProps {
  isOpen: boolean
  onClose: () => void
  value: string
  onChange: (value: string) => void
}

export default function GenderSelectorDrawer({
  isOpen,
  onClose,
  value,
  onChange,
}: GenderSelectorDrawerProps) {
  const [tempGender, setTempGender] = useState(value)

  return (
    <Drawer open={isOpen} repositionInputs={false} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent
        className="bg-white rounded-t-[32px] p-0 flex flex-col focus:outline-none overflow-hidden text-[#1A1A1A] data-[vaul-drawer-direction=bottom]:max-h-[calc(var(--app-viewport-height,100dvh)-var(--safe-top)-0.5rem)]"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex items-start justify-between px-4 pt-2 pb-4 sm:px-6 shrink-0 relative">
          <div className="flex flex-col text-left">
            <DrawerTitle className="text-[20px] font-extrabold text-[#1A1A1A] leading-tight">Select Gender</DrawerTitle>
            <DrawerDescription className="text-[13px] text-[#9A9590] mt-1 font-medium">Choose your gender identity.</DrawerDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-[#F7F5F0] text-[#6B6B6B] flex items-center justify-center cursor-pointer hover:opacity-80 outline-none border-0"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col">
            {[
              { label: 'Male', value: 'Male' },
              { label: 'Female', value: 'Female' },
              { label: 'Other', value: 'Other' }
            ].map((opt) => {
              const isSelected = tempGender === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTempGender(opt.value)}
                  className="w-full min-h-14 flex items-center justify-between py-3.5 px-4 sm:px-6 border-b border-[#EBEBEB] text-left text-base font-semibold transition-colors outline-none cursor-pointer hover:bg-gray-50/50"
                >
                  <span>{opt.label}</span>
                  <div className={cn(
                    "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                    isSelected ? "border-positive bg-positive" : "border-[#D1D1D6]"
                  )}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-4 py-3 sm:px-6 sm:py-4 shrink-0 bg-white border-t border-[#EBEBEB]">
          <Button
            type="button"
            onClick={() => {
              onChange(tempGender)
              onClose()
            }}
            disabled={!tempGender}
            className="w-full h-14 rounded-full bg-[#FDB105] hover:bg-[#FDB105]/95 text-white font-bold text-base "
          >
            Confirm
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
