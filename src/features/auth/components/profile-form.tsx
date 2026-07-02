import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  Calendar as CalendarIcon,
  User,
  Mail,
  Briefcase,
  Heart,
  Camera,
  ChevronLeft,
  ChevronDown,
  Check
} from 'lucide-react'
import { differenceInYears, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { cn } from '@/lib/utils'

/** Exported so auth-screen.tsx can type its handleProfileSubmit handler */
export interface ProfileFormData {
  age: string
  gender: string
  email: string
  occupation: string
  maritalStatus: string
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
  maritalStatus: string
}

export default function ProfileForm({ onSubmit }: ProfileFormProps) {
  const { control, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      dob: undefined,
      gender: '',
      email: '',
      occupation: '',
      maritalStatus: '',
    },
  })

  // Avatar uses a separate state since it's a File/URL, not a serialisable form field
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Drawer states
  const [isGenderOpen, setIsGenderOpen] = useState(false)
  const [isOccupationOpen, setIsOccupationOpen] = useState(false)
  const [isMaritalStatusOpen, setIsMaritalStatusOpen] = useState(false)

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
      maritalStatus: values.maritalStatus,
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

            {/* Age Input (Popover with Calendar) */}
            <div className="space-y-1.5 w-full">
              <Label className="text-sm font-semibold text-foreground px-1">Age</Label>
              <Controller
                name="dob"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        className="w-full h-12 pl-12 pr-4 rounded-full border-[0.98px] border-[#EFE7DD] bg-[#FEF5EE] text-foreground hover:bg-[#FEF5EE] justify-start font-normal text-sm relative shadow-none focus-visible:ring-1 focus-visible:ring-primary [&_svg:last-child]:text-[#9A9590]"
                      >
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9590]">
                          <CalendarIcon size={18} />
                        </span>
                        {field.value ? (
                          <span className="text-foreground">{format(field.value, "dd MMM yyyy")} ({differenceInYears(new Date(), field.value)} years)</span>
                        ) : (
                          <span className="text-[#9A9590]">Enter your age</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        captionLayout='dropdown'
                      />
                    </PopoverContent>
                  </Popover>
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

                    <Drawer open={isGenderOpen} onOpenChange={setIsGenderOpen}>
                      <DrawerContent className="bg-white rounded-t-[32px] p-0 flex flex-col focus:outline-none overflow-hidden text-[#1A1A1A]">
                        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0 relative">
                          <button
                            type="button"
                            onClick={() => setIsGenderOpen(false)}
                            className="size-8 rounded-full bg-[#FEFAF1] border border-[#EBEBEB] text-[#6B6B6B] flex items-center justify-center cursor-pointer hover:bg-muted/10 outline-none focus:outline-none font-sans text-xs font-bold"
                          >
                            ✕
                          </button>
                          <h3 className="text-lg font-extrabold text-[#1A1A1A] absolute left-1/2 -translate-x-1/2">Select Gender</h3>
                          <div className="size-8" />
                        </div>
                        <hr className="border-[#EBEBEB] border-b-[0.8px] w-full shrink-0" />
                        <div className="p-6 flex flex-col gap-3">
                          {[
                            { label: 'Male', value: 'male' },
                            { label: 'Female', value: 'female' },
                            { label: 'Other', value: 'other' }
                          ].map((opt) => {
                            const isSelected = field.value === opt.value
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  field.onChange(opt.value)
                                  setIsGenderOpen(false)
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between py-4 px-5 rounded-xl border border-[#EBEBEB] text-left text-sm font-semibold transition-colors outline-none cursor-pointer",
                                  isSelected ? "bg-[#FFF9E6] border-[#FDB105]" : "bg-[#FEFAF1] hover:bg-gray-50/50"
                                )}
                              >
                                <span className="capitalize">{opt.label}</span>
                                {isSelected && <Check size={16} className="text-[#0B683A] stroke-[3px]" />}
                              </button>
                            )
                          })}
                        </div>
                      </DrawerContent>
                    </Drawer>
                  </>
                )}
              />
            </div>

            {/* Occupation Input */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground px-1">Occupation</Label>
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
                        {field.value ? (field.value === 'self-employed' ? 'Self-employed' : field.value.charAt(0).toUpperCase() + field.value.slice(1)) : "Select occupation"}
                      </span>
                      <ChevronDown size={16} className="text-[#9A9590]" />
                    </button>

                    <Drawer open={isOccupationOpen} onOpenChange={setIsOccupationOpen}>
                      <DrawerContent className="bg-white rounded-t-[32px] p-0 flex flex-col focus:outline-none overflow-hidden text-[#1A1A1A]">
                        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0 relative">
                          <button
                            type="button"
                            onClick={() => setIsOccupationOpen(false)}
                            className="size-8 rounded-full bg-[#FEFAF1] border border-[#EBEBEB] text-[#6B6B6B] flex items-center justify-center cursor-pointer hover:bg-muted/10 outline-none focus:outline-none font-sans text-xs font-bold"
                          >
                            ✕
                          </button>
                          <h3 className="text-lg font-extrabold text-[#1A1A1A] absolute left-1/2 -translate-x-1/2">Select Occupation</h3>
                          <div className="size-8" />
                        </div>
                        <hr className="border-[#EBEBEB] border-b-[0.8px] w-full shrink-0" />
                        <div className="p-6 flex flex-col gap-3">
                          {[
                            { label: 'Student', value: 'student' },
                            { label: 'Professional', value: 'professional' },
                            { label: 'Self-employed', value: 'self-employed' },
                            { label: 'Unemployed', value: 'unemployed' },
                            { label: 'Other', value: 'other' }
                          ].map((opt) => {
                            const isSelected = field.value === opt.value
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  field.onChange(opt.value)
                                  setIsOccupationOpen(false)
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between py-4 px-5 rounded-xl border border-[#EBEBEB] text-left text-sm font-semibold transition-colors outline-none cursor-pointer",
                                  isSelected ? "bg-[#FFF9E6] border-[#FDB105]" : "bg-[#FEFAF1] hover:bg-gray-50/50"
                                )}
                              >
                                <span>{opt.label}</span>
                                {isSelected && <Check size={16} className="text-[#0B683A] stroke-[3px]" />}
                              </button>
                            )
                          })}
                        </div>
                      </DrawerContent>
                    </Drawer>
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

            {/* Marital Status Input */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground px-1">Marital status <span className='text-[#9A9590] font-normal'>(Optional)</span></Label>
              <Controller
                name="maritalStatus"
                control={control}
                render={({ field }) => (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsMaritalStatusOpen(true)}
                      className="w-full h-12 pl-12 pr-10 rounded-full border-[0.98px] border-[#EFE7DD] bg-[#FEF5EE] text-foreground text-sm focus:ring-0 focus:border-primary focus:outline-none relative flex items-center justify-between shadow-none font-normal cursor-pointer"
                    >
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9590]">
                        <Heart size={18} />
                      </span>
                      <span className={field.value ? "text-foreground capitalize" : "text-[#9A9590]"}>
                        {field.value || "Select marital status"}
                      </span>
                      <ChevronDown size={16} className="text-[#9A9590]" />
                    </button>

                    <Drawer open={isMaritalStatusOpen} onOpenChange={setIsMaritalStatusOpen}>
                      <DrawerContent className="bg-white rounded-t-[32px] p-0 flex flex-col focus:outline-none overflow-hidden text-[#1A1A1A]">
                        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0 relative">
                          <button
                            type="button"
                            onClick={() => setIsMaritalStatusOpen(false)}
                            className="size-8 rounded-full bg-[#FEFAF1] border border-[#EBEBEB] text-[#6B6B6B] flex items-center justify-center cursor-pointer hover:bg-muted/10 outline-none focus:outline-none font-sans text-xs font-bold"
                          >
                            ✕
                          </button>
                          <h3 className="text-lg font-extrabold text-[#1A1A1A] absolute left-1/2 -translate-x-1/2">Select Marital Status</h3>
                          <div className="size-8" />
                        </div>
                        <hr className="border-[#EBEBEB] border-b-[0.8px] w-full shrink-0" />
                        <div className="p-6 flex flex-col gap-3">
                          {[
                            { label: 'Single', value: 'single' },
                            { label: 'Married', value: 'married' },
                            { label: 'Divorced', value: 'divorced' }
                          ].map((opt) => {
                            const isSelected = field.value === opt.value
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  field.onChange(opt.value)
                                  setIsMaritalStatusOpen(false)
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between py-4 px-5 rounded-xl border border-[#EBEBEB] text-left text-sm font-semibold transition-colors outline-none cursor-pointer",
                                  isSelected ? "bg-[#FFF9E6] border-[#FDB105]" : "bg-[#FEFAF1] hover:bg-gray-50/50"
                                )}
                              >
                                <span className="capitalize">{opt.label}</span>
                                {isSelected && <Check size={16} className="text-[#0B683A] stroke-[3px]" />}
                              </button>
                            )
                          })}
                        </div>
                      </DrawerContent>
                    </Drawer>
                  </>
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
            <ChevronLeft size={16} strokeWidth={2.5} className="rotate-180 ml-1" />
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            You can update these later in profile settings.
          </p>
        </div>
      </form>
    </div>
  )
}
