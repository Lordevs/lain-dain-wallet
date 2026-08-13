import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

// Import sub-forms
import PhoneForm from './phone-form'
import OtpForm from './otp-form'
import SuccessCheck from '@/components/shared/success-check'
import BrandLogo from '@/components/shared/brand-logo'

// Import store
import { ROUTES } from '@/constants/routes'

type AuthStep = 'signin' | 'signup_phone' | 'otp' | 'success'

// Only reachable when NOT authenticated — see __root.tsx's beforeLoad,
// which redirects an authenticated user away before this ever mounts
// (to /onboarding if their profile is incomplete, to the dashboard
// otherwise). That guarantee is what lets phone/OTP stay pure step state
// here instead of needing their own routes: there's no URL a signed-in
// user could hit that would land back on them.
export default function AuthScreen() {
  const navigate = useNavigate()

  const [step, setStep] = useState<AuthStep>('signin')
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [phone, setPhone] = useState('') // Empty initially
  // Set by OtpForm once verification succeeds — the source of truth for
  // whether "success" should lead to onboarding or straight to the app,
  // replacing the old signin/signup-mode guess with the backend's own
  // profile_complete flag.
  const [needsProfile, setNeedsProfile] = useState(false)

  const handleBack = () => {
    if (step === 'signup_phone') setStep('signin')
    else if (step === 'otp') setStep(authMode === 'signup' ? 'signup_phone' : 'signin')
  }

  const handlePhoneContinue = (enteredPhone: string) => {
    setPhone(enteredPhone)
    setAuthMode('signup')
    setStep('otp')
  }

  return (
    <div className="flex flex-col flex-1 px-6 pb-8 pt-4 w-full bg-[#FEFAF1] min-height-screen justify-between relative overflow-y-auto">
      {/* Top Header/Back Button */}
      <div className="h-12 flex items-center justify-between shrink-0">
        {['signup_phone', 'otp'].includes(step) ? (
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground active:scale-95 transition-all"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
        ) : (
          <div className="w-10 h-10"></div>
        )}
      </div>

      {step === 'signin' && (
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <BrandLogo />
            <PhoneForm
              mode="signin"
              initialPhone={phone}
              onSubmit={(enteredPhone) => {
                setPhone(enteredPhone)
                setAuthMode('signin')
                setStep('otp')
              }}
              onToggleMode={() => setStep('signup_phone')}
            />
          </div>
        </div>
      )}

      {step === 'signup_phone' && (
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <BrandLogo />
            <PhoneForm
              mode="signup"
              initialPhone={phone}
              onSubmit={handlePhoneContinue}
              onToggleMode={() => setStep('signin')}
            />
          </div>
        </div>
      )}

      {step === 'otp' && (
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <BrandLogo />
            <OtpForm
              phoneNumber={phone}
              onVerify={(needsProfileStep) => {
                setNeedsProfile(needsProfileStep)
                setStep('success')
              }}
              onBack={() => setStep(authMode === 'signup' ? 'signup_phone' : 'signin')}
            />
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="flex-1 flex items-center justify-center">
          <SuccessCheck onComplete={() => {
            navigate({ to: needsProfile ? ROUTES.ONBOARDING : ROUTES.DASHBOARD })
          }} />
        </div>
      )}

      {(step === 'signin' || step === 'signup_phone') && (
        <button
          type="button"
          onClick={() => navigate({ to: ROUTES.PRIVACY_POLICY })}
          className="mx-auto mt-6 border-0 bg-transparent p-1 text-center text-xs font-semibold text-[#6B6B6B] underline underline-offset-4 cursor-pointer"
        >
          Privacy Policy
        </button>
      )}
    </div>
  )
}
