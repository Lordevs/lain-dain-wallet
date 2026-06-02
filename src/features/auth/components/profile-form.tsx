import { useState } from 'react'
import {
  Calendar as CalendarIcon,
  User,
  Mail,
  Briefcase,
  Heart,
  Camera,
  ChevronLeft
} from 'lucide-react'
import { differenceInYears, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProfileFormProps {
  onSubmit: (profile: {
    age: string
    gender: string
    email: string
    occupation: string
    maritalStatus: string
    avatar: string | null
  }) => void
}

export default function ProfileForm({ onSubmit }: ProfileFormProps) {
  const [age, setAge] = useState('')
  const [dob, setDob] = useState<Date | undefined>(undefined)
  const [gender, setGender] = useState('')
  const [email, setEmail] = useState('')
  const [occupation, setOccupation] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      age,
      gender,
      email,
      occupation,
      maritalStatus,
      avatar
    })
  }

  return (
    <div className="flex-1 flex flex-col justify-between w-full">
      <form onSubmit={handleSubmit} className="w-full">
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
                  {avatar ? (
                    <AvatarImage src={avatar} alt="Profile photo" className="object-cover" />
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    className="w-full h-12 pl-12 pr-4 rounded-full border-[0.98px] border-[#EFE7DD] bg-[#FEF5EE] text-foreground hover:bg-[#FEF5EE] justify-start font-normal text-sm relative shadow-none focus-visible:ring-1 focus-visible:ring-primary [&_svg:last-child]:text-[#9A9590]"
                  >
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9590]">
                      <CalendarIcon size={18} />
                    </span>
                    {dob ? (
                      <span className="text-foreground">{format(dob, "dd MMM yyyy")} ({differenceInYears(new Date(), dob)} years)</span>
                    ) : (
                      <span className="text-[#9A9590]">Enter your age</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dob}
                    onSelect={(date) => {
                      setDob(date)
                      if (date) {
                        setAge(differenceInYears(new Date(), date).toString())
                      } else {
                        setAge("")
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    captionLayout='dropdown'
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Gender Input */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground px-1">Select Gender</Label>
              <Select value={gender} onValueChange={setGender} required>
                <SelectTrigger className="w-full h-12! pl-12 pr-10 rounded-full border-[0.98px] border-[#EFE7DD] bg-[#FEF5EE] text-foreground text-sm focus:ring-0 focus:border-primary relative flex justify-between items-center select-none shadow-none font-normal [&_svg:last-child]:text-[#9A9590]">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9590]">
                    <User size={18} />
                  </span>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-[#FEFAF1] border-[#EFE7DD] p-1">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground px-1">Email <span className='text-[#9A9590] font-normal'>(Optional)</span></Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9590]">
                  <Mail size={18} />
                </span>
                <Input
                  type="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-12 pr-4 rounded-full border-[0.98px] border-[#EFE7DD] bg-[#FEF5EE] text-foreground text-sm placeholder:text-[#9A9590] shadow-none"
                />
              </div>
            </div>

            {/* Occupation Input */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground px-1">Occupation <span className='text-[#9A9590] font-normal'>(Optional)</span></Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9590]">
                  <Briefcase size={18} />
                </span>
                <Input
                  type="text"
                  placeholder="Enter your occupation"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="h-12 pl-12 pr-4 rounded-full border-[0.98px] border-[#EFE7DD] bg-[#FEF5EE] text-foreground text-sm placeholder:text-[#9A9590] shadow-none"
                />
              </div>
            </div>

            {/* Marital Status Input */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground px-1">Marital status <span className='text-[#9A9590] font-normal'>(Optional)</span></Label>
              <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                <SelectTrigger className="w-full h-12! pl-12 pr-10 rounded-full border-[0.98px] border-[#EFE7DD] bg-[#FEF5EE] text-foreground text-sm focus:ring-0 focus:border-primary relative flex justify-between items-center select-none shadow-none font-normal [&_svg:last-child]:text-[#9A9590]">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9590]">
                    <Heart size={18} />
                  </span>
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent className="bg-[#FEFAF1] border-[#EFE7DD] p-1">
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-10 space-y-6 shrink-0">
          <Button
            type="submit"
            className="w-full h-14 bg-primary text-white rounded-full font-bold text-base shadow-[0px_7.03px_23.42px_0px_rgba(11,104,58,0.35)] hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5"
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
