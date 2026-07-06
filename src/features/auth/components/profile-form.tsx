import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  User,
  Mail,
  Briefcase,
  Globe,
  Camera,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import { differenceInYears, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import SelectDateDrawer from '@/components/shared/select-date-drawer'
import GenderSelectorDrawer from '@/components/shared/gender-selector-drawer'
import OccupationSelectorDrawer from '@/components/shared/occupation-selector-drawer'
import CountrySelectorDrawer from '@/components/shared/country-selector-drawer'

/** Exported so auth-screen.tsx can type its handleProfileSubmit handler */
export interface ProfileFormData {
  age: string
  gender: string
  email: string
  occupation: string
  country: string
  avatar: string | null
}

interface ProfileFormProps {
  onSubmit: (profile: ProfileFormData) => void
}

interface FormValues {
  dob: Date | undefined
  gender: string
  email: string
  occupation: string
  country: string
}

export default function ProfileForm({ onSubmit }: ProfileFormProps) {
  const { control, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      dob: undefined,
      gender: '',
      email: '',
      occupation: '',
      country: '',
    },
  })

  // Avatar uses a separate state since it's a File/URL, not a serialisable form field
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Drawer states
  const [isDobOpen, setIsDobOpen] = useState(false)
  const [isGenderOpen, setIsGenderOpen] = useState(false)
  const [isOccupationOpen, setIsOccupationOpen] = useState(false)
  const [isCountryOpen, setIsCountryOpen] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Use Object URL — avoids storing large base64 strings in state/memory
    const url = URL.createObjectURL(file)
    setAvatarUrl(url)
  }

  const dob = watch('dob')
  const age = dob ? String(differenceInYears(new Date(), dob)) : ''

  const onFormSubmit = (values: FormValues) => {
    onSubmit({
      age,
      gender: values.gender,
      email: values.email,
      occupation: values.occupation,
      country: values.country,
      avatar: avatarUrl,
    })
  }

  return (
    <div className="flex-1 flex flex-col justify-between w-full">
      <form onSubmit={handleSubmit(onFormSubmit)} className="w-full">
        <div>
          <div className="mb-6 text-left">
            <h2 className="text-xl font-bold text-foreground leading-tight">Complete your profile</h2>
            <p className="text-muted-foreground mt-0.5 text-base">Just a few more details to personalize your account.</p>
          </div>
          {/* Profile details card */}
          <div className="bg-white border border-[#EFE7DD] rounded-3xl p-5 shadow-[0_4.88px_24.38px_0px_#0000000F] space-y-4 text-left">
            {/* Avatar uploader */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-2 border-[#EFE7DD] shadow-sm">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt="Profile photo" className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-[#EDEAE5] text-[#C0BAB2]">
                      <User size={40} />
                    </AvatarFallback>
                  )}
                </Avatar>
                <label className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-primary hover:bg-primary/95 flex items-center justify-center text-white cursor-pointer shadow-[0_2.44px_7.31px_0px_#0B683A66] transition-colors">
                  <Camera size={20} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              <span className="text-base font-semibold text-primary mt-2">Add profile photo</span>
            </div>

            {/* Date of Birth Input */}
            <div className="space-y-1.5 w-full">
              <Label className="text-sm font-semibold text-foreground px-1">Date of Birth</Label>
              <Controller
                name="dob"
                control={control}
                render={({ field }) => (
                  <>
                    <Button
                      type="button"
                      onClick={() => setIsDobOpen(true)}
                      className="w-full h-12 pl-4 pr-4 rounded-full border-[0.98px] border-[#EFE7DD] bg-[#FEF5EE] text-foreground hover:bg-[#FEF5EE] justify-start font-normal text-sm relative shadow-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      {field.value ? (
                        <span className="text-foreground">{format(field.value, 'dd MMM yyyy')} ({differenceInYears(new Date(), field.value)} years)</span>
                      ) : (
                        <span className="text-[#9A9590]">Enter your DOB</span>
                      )}
                    </Button>
                    <SelectDateDrawer
                      isOpen={isDobOpen}
                      onClose={() => setIsDobOpen(false)}
                      onSelectDate={(date) => field.onChange(date)}
                      selectedDateValue={field.value}
                      type="dob"
                    />
                  </>
                )}
              />
            </div>

            {/* Gender Input */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground px-1">Select Gender</Label>
              <Controller
                name="gender"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsGenderOpen(true)}
                      className="w-full h-12 pl-12 pr-10 rounded-full border-[0.98px] border-[#EFE7DD] bg-[#FEF5EE] text-foreground text-sm focus:ring-0 focus:border-primary focus:outline-none relative flex items-center justify-between shadow-none font-normal cursor-pointer"
                    >
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9590]">
                        <User size={18} />
                      </span>
                      <span className={field.value ? "text-foreground capitalize" : "text-[#9A9590]"}>
                        {field.value || "Select gender"}
                      </span>
                      <ChevronDown size={16} className="text-[#9A9590]" />
                    </button>

                    <GenderSelectorDrawer
                      isOpen={isGenderOpen}
                      onClose={() => setIsGenderOpen(false)}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </>
                )}
              />
            </div>

            {/* Country Input */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground px-1">Select Country</Label>
              <Controller
                name="country"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsCountryOpen(true)}
                      className="w-full h-12 pl-12 pr-10 rounded-full border-[0.98px] border-[#EFE7DD] bg-[#FEF5EE] text-foreground text-sm focus:ring-0 focus:border-primary focus:outline-none relative flex items-center justify-between shadow-none font-normal cursor-pointer"
                    >
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9590]">
                        <Globe size={18} />
                      </span>
                      <span className={field.value ? "text-foreground capitalize" : "text-[#9A9590]"}>
                        {field.value || "Select country"}
                      </span>
                      <ChevronDown size={16} className="text-[#9A9590]" />
                    </button>

                    <CountrySelectorDrawer
                      isOpen={isCountryOpen}
                      onClose={() => setIsCountryOpen(false)}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </>
                )}
              />
            </div>

            {/* Occupation Input */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground px-1">What best describes you?</Label>
              <Controller
                name="occupation"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsOccupationOpen(true)}
                      className="w-full h-12 pl-12 pr-10 rounded-full border-[0.98px] border-[#EFE7DD] bg-[#FEF5EE] text-foreground text-sm focus:ring-0 focus:border-primary focus:outline-none relative flex items-center justify-between shadow-none font-normal cursor-pointer"
                    >
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9590]">
                        <Briefcase size={18} />
                      </span>
                      <span className={field.value ? "text-foreground capitalize" : "text-[#9A9590]"}>
                        {field.value || "Select occupation"}
                      </span>
                      <ChevronDown size={16} className="text-[#9A9590]" />
                    </button>

                    <OccupationSelectorDrawer
                      isOpen={isOccupationOpen}
                      onClose={() => setIsOccupationOpen(false)}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </>
                )}
              />
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground px-1">Email <span className='text-[#9A9590] font-normal'>(Optional)</span></Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9590]">
                      <Mail size={18} />
                    </span>
                    <Input
                      type="email"
                      placeholder="Enter Email"
                      className="h-12 pl-12 pr-4 rounded-full border-[0.98px] border-[#EFE7DD] bg-[#FEF5EE] text-foreground text-sm placeholder:text-[#9A9590] shadow-none"
                      {...field}
                    />
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-10 space-y-6 shrink-0">
          <Button
            type="submit"
            className="w-full h-14 bg-primary text-white rounded-full font-bold text-base hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5"
          >
            Create Account
            <ChevronRight size={16} strokeWidth={2.5} className="ml-1" />
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            You can update these later in profile settings.
          </p>
        </div>
      </form>
    </div>
  )
}
