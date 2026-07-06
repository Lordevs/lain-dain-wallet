import { useState, useEffect, useRef } from 'react'
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface CountrySelectorDrawerProps {
  isOpen: boolean
  onClose: () => void
  value: string
  onChange: (value: string) => void
}

export default function CountrySelectorDrawer({
  isOpen,
  onClose,
  value,
  onChange,
}: CountrySelectorDrawerProps) {
  const standardOptions = [
    'Afghanistan',
    'Azerbaijan',
    'Bahrain',
    'Bangladesh',
    'Canada',
    'China',
    'India',
    'Iran',
    'Iraq',
    'Kuwait',
    'Malaysia',
    'Maldives',
    'Mauritius',
    'Nepal',
    'Oman',
    'Pakistan',
    'Palestine',
    'Qatar',
    'Saudi Arabia',
    'Singapore',
    'South Africa',
    'Sri Lanka',
    'Thailand',
    'Turkey',
    'United Arab Emirates',
    'United Kingdom',
    'United States'
  ]

  const getInitialState = () => {
    if (standardOptions.includes(value)) {
      return { country: value, custom: '' }
    } else if (value === 'Other') {
      return { country: 'Other', custom: '' }
    } else if (value) {
      return { country: 'Other', custom: value }
    } else {
      return { country: '', custom: '' }
    }
  }

  const initialState = getInitialState()
  const [tempCountry, setTempCountry] = useState(initialState.country)
  const [tempCustom, setTempCustom] = useState(initialState.custom)
  const customInputContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tempCountry === 'Other') {
      setTimeout(() => {
        customInputContainerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }, 80)
    }
  }, [tempCountry])

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-[32px] p-0 data-[vaul-drawer-direction=bottom]:h-[80vh]! flex flex-col focus:outline-none overflow-hidden text-[#1A1A1A]">
        <div className="flex items-start justify-between px-6 pt-2 pb-4 shrink-0 relative">
          <div className="flex flex-col text-left">
            <h3 className="text-[20px] font-extrabold text-[#1A1A1A] leading-tight">Select Country</h3>
            <p className="text-[13px] text-[#9A9590] mt-1 font-medium">Choose your country of residence.</p>
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
              const isSelected = tempCountry === opt
              return (
                <button
                   key={opt}
                   type="button"
                   onClick={() => setTempCountry(opt)}
                   className="w-full flex items-center justify-between py-4 px-6 border-b border-[#E0E0E0] text-left text-base font-semibold transition-colors outline-none cursor-pointer hover:bg-gray-50/50"
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

          {tempCountry === 'Other' && (
            <div ref={customInputContainerRef} className="px-6 py-4 flex flex-col gap-2.5 text-left bg-white">
              <label className="text-[13px] font-bold text-[#1A1A1A]">Tell us your country</label>
              <Input
                type="text"
                placeholder="e.g. Germany, Japan, Turkey"
                value={tempCustom}
                onChange={(e) => setTempCustom(e.target.value)}
                className="w-full h-12 px-4 rounded-sm border border-[#E0E0E0] bg-[#F7F7F7] text-sm focus:outline-none focus:border-primary"
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 shrink-0 bg-white border-t border-[#E0E0E0]">
          <Button
            type="button"
            onClick={() => {
              const finalValue = tempCountry === 'Other' ? tempCustom : tempCountry
              onChange(finalValue)
              onClose()
            }}
            disabled={!tempCountry || (tempCountry === 'Other' && !tempCustom.trim())}
            className="w-full h-14 rounded-full bg-[#FDB105] hover:bg-[#FDB105]/95 text-white font-bold text-base "
          >
            Confirm
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
