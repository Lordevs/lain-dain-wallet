import { useState } from 'react'
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface OccupationSelectorDrawerProps {
  isOpen: boolean
  onClose: () => void
  value: string
  onChange: (value: string) => void
}

export default function OccupationSelectorDrawer({
  isOpen,
  onClose,
  value,
  onChange,
}: OccupationSelectorDrawerProps) {
  const standardOptions = [
    'Student',
    'Business Owner',
    'Salaried Employee',
    'Free Lancer',
    'House Maker',
    'Teacher / Education',
    'Doctor / Medical',
    'Government Employee'
  ]

  const getInitialState = () => {
    if (standardOptions.includes(value)) {
      return { occupation: value, custom: '' }
    } else if (value === 'Other') {
      return { occupation: 'Other', custom: '' }
    } else if (value) {
      return { occupation: 'Other', custom: value }
    } else {
      return { occupation: '', custom: '' }
    }
  }

  const initialState = getInitialState()
  const [tempOccupation, setTempOccupation] = useState(initialState.occupation)
  const [tempCustom, setTempCustom] = useState(initialState.custom)

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-[32px] p-0 flex flex-col data-[vaul-drawer-direction=bottom]:h-[80vh]! focus:outline-none overflow-hidden text-[#1A1A1A]">
        <div className="flex items-start justify-between px-6 pt-2 pb-4 shrink-0 relative">
          <div className="flex flex-col text-left">
            <h3 className="text-[20px] font-extrabold text-[#1A1A1A] leading-tight">What best describes you?</h3>
            <p className="text-[13px] text-[#9A9590] mt-1 font-medium">This helps us understand our users better.</p>
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
            {[...standardOptions, 'Other'].map((opt) => {
              const isSelected = tempOccupation === opt
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setTempOccupation(opt)}
                  className="w-full flex items-center justify-between py-4 px-6 border-b border-[#EBEBEB] text-left text-base font-semibold transition-colors outline-none cursor-pointer hover:bg-gray-50/50"
                >
                  <span>{opt}</span>
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

          {tempOccupation === 'Other' && (
            <div className="px-6 py-4 flex flex-col gap-2.5 text-left bg-white">
              <label className="text-[13px] font-bold text-[#1A1A1A]">Tell us what you do</label>
              <Input
                type="text"
                placeholder="e.g. Artist, Lawyer, Content Creator"
                value={tempCustom}
                onChange={(e) => setTempCustom(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-[#E0E0E0] bg-[#F7F7F7] text-sm focus:outline-none focus:border-primary"
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 shrink-0 bg-white border-t border-[#EBEBEB]">
          <Button
            type="button"
            onClick={() => {
              const finalValue = tempOccupation === 'Other' ? tempCustom : tempOccupation
              onChange(finalValue)
              onClose()
            }}
            disabled={!tempOccupation || (tempOccupation === 'Other' && !tempCustom.trim())}
            className="w-full h-14 rounded-full bg-[#FDB105] hover:bg-[#FDB105]/95 text-white font-bold text-base "
          >
            Confirm
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
