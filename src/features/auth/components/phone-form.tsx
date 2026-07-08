import { useState } from 'react'
import { ChevronLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/reui/phone-input'

interface PhoneFormProps {
  mode: 'signin' | 'signup'
  initialPhone: string
  onSubmit: (phone: string) => void
  onToggleMode: () => void
}

export default function PhoneForm({
  mode,
  initialPhone,
  onSubmit,
  onToggleMode,
}: PhoneFormProps) {
  // initialPhone is expected to be a full E.164 string like "+923219988776"
  const [phone, setPhone] = useState(initialPhone || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (phone) {
      onSubmit(phone)
    }
  }

  const isSignIn = mode === 'signin'

  return (
    <div className="flex-1 flex flex-col justify-between w-full">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
        <div>
          <div className="mb-6 text-left">
            {isSignIn ? (
              <>
                <h2 className="text-xl font-bold text-foreground leading-tight">Welcome Back</h2>
                <p className="text-muted-foreground mt-0.5 text-base">Sign in to manage your balances</p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-foreground leading-tight">Create your account</h2>
                <p className="text-primary mt-0.5 text-base">
                  One place for every Lain Dain.
                </p>
              </>
            )}
          </div>

          {/* Phone Input Card */}
          <div className="bg-white rounded-lg border-[0.98px] border-[#EFE7DD] p-5 shadow-[0px_4.88px_24.38px_0px_rgba(0,0,0,0.06)] text-left">
            <Label className="text-sm font-medium text-foreground mb-3 block">
              Enter Your Phone Number to Continue.
            </Label>

            <div className="w-full">
              <PhoneInput
                value={phone}
                onChange={(val) => setPhone(val || '')}
                className="w-full text-foreground [&_button]:h-14 [&_button]:rounded-l-full [&_button]:bg-[#FEF5EE] [&_button]:border-t-[0.98px] [&_button]:border-t-[#EFE7DD] [&_button]:border-b [&_button]:border-l [&_button]:border-[#EADBCC] [&_button]:border-r-0 [&_input]:h-14 [&_input]:rounded-r-full [&_input]:bg-[#FEF5EE] [&_input]:border-t-[0.98px] [&_input]:border-t-[#EFE7DD] [&_input]:border-b [&_input]:border-r [&_input]:border-[#EADBCC] [&_input]:pl-4 [&_input]:placeholder:text-[#9A9590] focus-within:[&_input]:border-primary focus-within:[&_button]:border-primary focus-within:[&_input]:ring-1 focus-within:[&_input]:ring-primary transition-all"
                placeholder="3xxxxxxxxxxxx"
                required
              />
            </div>

            {/* Verification Notice */}
            <div className="flex items-start gap-3 mt-5">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-0.5">
                <Check size={12} strokeWidth={3} />
              </div>
              <p className="text-sm text-[#6B6B6B] leading-tight">
                We'll send you an <span className="text-primary font-semibold">OTP</span> to verify your number
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 space-y-12 shrink-0">
          <p className="text-sm text-muted-foreground text-center">
            {isSignIn ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-primary font-bold hover:underline cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-primary font-bold hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </>
            )}
          </p>

          <Button
            type="submit"
            className="w-full h-14 bg-primary text-white rounded-full font-bold text-base hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Continue
            <ChevronLeft size={16} strokeWidth={2.5} className="rotate-180 ml-1" />
          </Button>
        </div>
      </form>
    </div>
  )
}
