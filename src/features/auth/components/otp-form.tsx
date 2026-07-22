import { useState } from 'react'
import { Phone } from 'lucide-react'
import { parsePhoneNumber } from 'react-phone-number-input'

// Import shadcn UI components
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import FormError from '@/components/shared/form-error'

// Import separate components
import CountdownTimer from './countdown-timer'
import { useRequestOtpMutation, useVerifyOtpMutation } from '@/features/auth/api/use-auth-mutations'
import { mapUserToProfile } from '@/features/auth/api/map-user'
import { setRefreshToken } from '@/lib/secure-storage'
import { useAuthStore } from '@/store/use-auth-store'

interface OtpFormProps {
  phoneNumber: string // E.164 format (e.g. "+923219988776")
  // Tells the caller whether the just-verified account still needs the
  // profile-completion step — isAuthenticated is already true by the time
  // this fires (see handleVerify below), so this is purely a UI routing
  // signal, not an auth gate.
  onVerify: (needsProfile: boolean) => void
  onBack: () => void
}

export default function OtpForm({
  phoneNumber,
  onVerify,
  onBack
}: OtpFormProps) {
  const [otpValue, setOtpValue] = useState('')
  const verifyOtp = useVerifyOtpMutation()
  const requestOtp = useRequestOtpMutation()
  const { setAccessToken, setProfile, setIsAuthenticated } = useAuthStore()

  // Parse calling code and national number dynamically
  let countryCallingCode = ''
  let nationalNumber = phoneNumber
  try {
    const parsed = phoneNumber ? parsePhoneNumber(phoneNumber) : null
    if (parsed) {
      countryCallingCode = `+${parsed.countryCallingCode}`
      nationalNumber = parsed.nationalNumber
    }
  } catch {
    // Silently ignore parse errors — phoneNumber may not be E.164 in all cases
  }

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    verifyOtp.mutate(
      { phoneNumber, code: otpValue },
      {
        onSuccess: async (data) => {
          if (!data) return
          setAccessToken(data.access)
          await setRefreshToken(data.refresh)
          const profile = mapUserToProfile(data.user)
          setProfile(profile)
          // Tokens are valid the instant OTP is verified — isAuthenticated
          // reflects "has a session," not "finished onboarding" (see
          // routes/__root.tsx), so this is safe to flip now even if the
          // profile step is still ahead.
          setIsAuthenticated(true)
          onVerify(!profile.profileComplete)
        },
      },
    )
  }

  const handleResend = () => {
    if (requestOtp.isPending) return
    requestOtp.mutate(phoneNumber)
  }

  return (
    <div className="flex-1 flex flex-col justify-between w-full">
      <form onSubmit={handleVerify} className="flex-1 flex flex-col justify-between">
        <div>
          <div className="mb-6 text-left">
            <h2 className="text-xl font-bold text-foreground leading-tight">Verify your Phone Number</h2>
            <p className="text-muted-foreground mt-0.5 text-base">We sent a 6-digit code to</p>
          </div>

          {/* Details Card using Alert component */}
          <Alert className="bg-[#FFF8E1] border-[1.17px] border-[#F3C62366] rounded-[30px] px-5 py-4 gap-x-3.5 shadow-none mb-8 text-left items-center *:[svg:not([class*='size-'])]:size-6.5">
            <Phone size={24} fill="none" className="[svg]:stroke-[#FDB105] shrink-0" />
            <div>
              <AlertTitle className="text-xs font-bold text-foreground leading-tight">
                {countryCallingCode} {nationalNumber}
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground mt-0.5">
                Check your message
              </AlertDescription>
            </div>
          </Alert>

          {/* Inputs */}
          <div className="text-left">
            <Label className="block text-xs font-bold text-muted-foreground tracking-wider mb-4">
              ENTER 6-DIGIT CODE
            </Label>

            <div className="flex justify-center w-full">
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={(val) => setOtpValue(val)}
                containerClassName="w-full flex justify-center"
              >
                <InputOTPGroup className="gap-1.5 min-[360px]:gap-2 min-[400px]:gap-2.5 w-full flex justify-between">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <InputOTPSlot
                      key={idx}
                      index={idx}
                      className="flex-1 max-w-[52px] h-[68px] rounded-[18px] text-center text-2xl font-bold text-foreground transition-all"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Reusable Countdown Timer Component */}
            <CountdownTimer onResend={handleResend} />

            <FormError message={verifyOtp.error?.message} className="mt-4 justify-center" />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-12 space-y-6 shrink-0">
          <Button
            type="submit"
            disabled={otpValue.length !== 6 || verifyOtp.isPending}
            className="w-full h-14 bg-primary text-white rounded-full font-bold text-base hover:bg-primary/95 disabled:bg-[#D9D2C5] disabled:text-white disabled:shadow-none disabled:opacity-100 transition-all"
          >
            {verifyOtp.isPending ? 'Verifying...' : 'Verify Phone Number'}
          </Button>

          <p className="text-sm font-medium text-muted-foreground text-center">
            Wrong Phone Number ?{' '}
            <button
              type="button"
              onClick={onBack}
              className="text-primary font-bold hover:underline"
            >
              Change it
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}
