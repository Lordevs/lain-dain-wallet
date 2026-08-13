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
import {
  ActiveDeviceSessionError,
  useRequestOtpMutation,
  useTakeoverMutation,
  useVerifyOtpMutation,
} from '@/features/auth/api/use-auth-mutations'
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
  const [deviceConflict, setDeviceConflict] = useState<ActiveDeviceSessionError | null>(null)
  const verifyOtp = useVerifyOtpMutation()
  const takeover = useTakeoverMutation()
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

  const finishLogin = async (data: Awaited<ReturnType<typeof verifyOtp.mutateAsync>>) => {
    setAccessToken(data.access)
    await setRefreshToken(data.refresh)
    const profile = mapUserToProfile(data.user)
    setProfile(profile)
    setIsAuthenticated(true)
    onVerify(!profile.profileComplete)
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setDeviceConflict(null)
    try {
      await finishLogin(await verifyOtp.mutateAsync({ phoneNumber, code: otpValue }))
    } catch (error) {
      if (error instanceof ActiveDeviceSessionError) setDeviceConflict(error)
    }
  }

  const handleTakeover = async () => {
    if (!deviceConflict) return
    await finishLogin(await takeover.mutateAsync(deviceConflict.takeoverToken))
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

            {deviceConflict ? (
              <Alert className="mt-5 border-tertiary/30 bg-orange-soft-bg text-left">
                <AlertTitle>Account active on another device</AlertTitle>
                <AlertDescription>
                  Your account is signed in on {deviceConflict.activeDeviceName}. Continuing will immediately log out that device and stop its notifications.
                </AlertDescription>
              </Alert>
            ) : (
              <FormError message={verifyOtp.error?.message} className="mt-4 justify-center" />
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-12 space-y-6 shrink-0">
          <Button
            type={deviceConflict ? 'button' : 'submit'}
            onClick={deviceConflict ? handleTakeover : undefined}
            disabled={deviceConflict ? takeover.isPending : otpValue.length !== 6 || verifyOtp.isPending}
            className="w-full h-14 bg-primary text-white rounded-full font-bold text-base hover:bg-primary/95 disabled:bg-[#D9D2C5] disabled:text-white disabled:shadow-none disabled:opacity-100 transition-all"
          >
            {deviceConflict
              ? (takeover.isPending ? 'Switching device...' : 'Log out old device and continue')
              : (verifyOtp.isPending ? 'Verifying...' : 'Verify Phone Number')}
          </Button>

          {deviceConflict && (
            <button
              type="button"
              onClick={onBack}
              className="w-full text-sm font-bold text-muted-foreground"
            >
              Cancel
            </button>
          )}
          <FormError message={takeover.error?.message} className="justify-center" />

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
