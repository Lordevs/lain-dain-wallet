"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react"
import type { ComponentProps } from "react"
import * as BasePhoneInput from "react-phone-number-input"
import flags from "react-phone-number-input/flags"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlobeIcon, ChevronDown, Check } from "lucide-react"
import { Drawer, DrawerContent } from "@/components/ui/drawer"

type PhoneInputSize = "sm" | "default" | "lg"

const PhoneInputContext = createContext<{
  variant: PhoneInputSize
  popupClassName?: string
  scrollAreaClassName?: string
}>({
  variant: "default",
  popupClassName: undefined,
  scrollAreaClassName: undefined,
})

type PhoneInputProps = Omit<
  ComponentProps<"input">,
  "onChange" | "value" | "ref"
> &
  Omit<
    BasePhoneInput.Props<typeof BasePhoneInput.default>,
    "onChange" | "variant" | "popupClassName" | "scrollAreaClassName"
  > & {
    onChange?: (value: BasePhoneInput.Value) => void
    variant?: PhoneInputSize
    popupClassName?: string
    scrollAreaClassName?: string
  }

function PhoneInput({
  className,
  variant,
  popupClassName,
  scrollAreaClassName,
  onChange,
  value,
  ...props
}: PhoneInputProps) {
  const phoneInputSize = variant || "default"
  return (
    <PhoneInputContext.Provider
      value={{ variant: phoneInputSize, popupClassName, scrollAreaClassName }}
    >
      <BasePhoneInput.default
        className={cn(
          "flex",
          props["aria-invalid"] &&
          "[&_*[data-slot=combobox-trigger]]:border-destructive [&_*[data-slot=combobox-trigger]]:ring-destructive/50",
          className
        )}
        flagComponent={FlagComponent}
        countrySelectComponent={CountrySelect}
        inputComponent={InputComponent}
        smartCaret={false}
        value={value || undefined}
        onChange={(value) => onChange?.(value || ("" as BasePhoneInput.Value))}
        {...props}
      />
    </PhoneInputContext.Provider>
  )
}

function InputComponent({ className, ...props }: ComponentProps<typeof Input>) {
  const { variant } = useContext(PhoneInputContext)

  return (
    <Input
      className={cn(
        "rounded-s-none focus:z-1",
        variant === "sm" &&
        "h-7",
        variant === "lg" &&
        "h-9",
        className
      )}
      {...props}
    />
  )
}

type CountryEntry = { label: string; value: BasePhoneInput.Country | undefined }

type CountrySelectProps = {
  disabled?: boolean
  value: BasePhoneInput.Country
  options: CountryEntry[]
  onChange: (country: BasePhoneInput.Country) => void
}

function CountrySelect({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
}: CountrySelectProps) {
  const { variant } = useContext(PhoneInputContext)
  const [searchValue, setSearchValue] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const filteredCountries = useMemo(() => {
    if (!searchValue) return countryList
    return countryList.filter(({ label }) =>
      label.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [countryList, searchValue])

  return (
    <>
      <Button
        variant="outline"
        size={variant}
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "rounded-s-full rounded-e-none flex items-center gap-1.5 border-e-0 px-4.5 py-0 leading-none hover:bg-transparent focus:z-10 data-pressed:bg-transparent h-full shrink-0 text-foreground border-input bg-transparent",
          disabled && "opacity-50"
        )}
        disabled={disabled}
      >
        <FlagComponent
          country={selectedCountry}
          countryName={selectedCountry}
        />
        {selectedCountry && (
          <span className="text-[15px] font-semibold text-foreground select-none">
            +{BasePhoneInput.getCountryCallingCode(selectedCountry)}
          </span>
        )}
        <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-0.5" />
      </Button>

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="bg-white rounded-t-[32px] p-0 flex flex-col focus:outline-none overflow-hidden text-[#1A1A1A] h-[75dvh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0 relative">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="size-8 rounded-full bg-[#FEFAF1] border border-[#EBEBEB] text-[#6B6B6B] flex items-center justify-center cursor-pointer hover:bg-muted/10 outline-none focus:outline-none font-sans text-xs font-bold"
            >
              ✕
            </button>
            <h3 className="text-lg font-extrabold text-[#1A1A1A] absolute left-1/2 -translate-x-1/2">Select Country</h3>
            <div className="size-8" />
          </div>
          <hr className="border-[#EBEBEB] border-b-[0.8px] w-full shrink-0" />

          {/* Search Input */}
          <div className="p-4 shrink-0">
            <Input
              type="text"
              placeholder="Search country..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-[#EBEBEB] bg-[#FEFAF1] text-foreground text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#FDB105]"
            />
          </div>

          {/* Countries list */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-2">
            {filteredCountries.map((item) => {
              if (!item.value) return null
              const isSelected = selectedCountry === item.value
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    onChange(item.value!)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center justify-between py-3.5 px-4 rounded-xl border border-[#EBEBEB] text-left text-sm font-semibold transition-colors outline-none cursor-pointer",
                    isSelected ? "bg-[#FFF9E6] border-[#FDB105]" : "bg-[#FEFAF1] hover:bg-gray-50/50"
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <FlagComponent country={item.value} countryName={item.label} />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#9A9590]">+{BasePhoneInput.getCountryCallingCode(item.value)}</span>
                    {isSelected && <Check size={16} className="text-[#0B683A] stroke-[3px]" />}
                  </div>
                </button>
              )
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

function FlagComponent({ country, countryName }: BasePhoneInput.FlagProps) {
  const Flag = flags[country]

  return (
    <span className="flex h-4 w-4 items-center justify-center [&_svg:not([class*='size-'])]:size-full! [&_svg:not([class*='size-'])]:rounded-[5px]">
      {Flag ? (
        <Flag title={countryName} />
      ) : (
        <GlobeIcon className="size-4 opacity-60" />
      )}
    </span>
  )
}

export { PhoneInput }