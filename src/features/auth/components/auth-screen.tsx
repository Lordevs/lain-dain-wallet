import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

// Import sub-forms
import PhoneForm from './phone-form'
import OtpForm from './otp-form'
import SuccessCheck from '@/components/shared/success-check'
import ProfileForm, { type ProfileFormData } from './profile-form'

// Import store
import { useAuthStore } from '@/store/use-auth-store'
import { ROUTES } from '@/constants/routes'

type AuthStep = 'signin' | 'signup_phone' | 'otp' | 'success' | 'profile'

// Defined outside the component so React doesn't treat it as a new type on every render
function BrandLogo() {
  return (
    <div className="flex flex-col items-center mt-2 mb-8 select-none">
      <div className="flex items-center gap-1.5 text-[32px] font-extrabold tracking-tight">
        <span className="text-primary">Lain</span>
        <span className="text-secondary">Dain</span>
      </div>
      <span className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground opacity-90 uppercase">
        Wallet
      </span>
    </div>
  )
}

export default function AuthScreen() {
  const navigate = useNavigate()
  const { setProfile, setIsAuthenticated } = useAuthStore()

  const [step, setStep] = useState<AuthStep>('signin')
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [phone, setPhone] = useState('') // Empty initially

  const handleBack = () => {
    if (step === 'signup_phone') setStep('signin')
    else if (step === 'otp') setStep(authMode === 'signup' ? 'signup_phone' : 'signin')
    else if (step === 'profile') setStep('otp')
  }

  const handlePhoneContinue = (enteredPhone: string) => {
    setPhone(enteredPhone)
    setAuthMode('signup')
    setStep('otp')
  }

  const handleProfileSubmit = (profileData: ProfileFormData) => {
    const { tempCountryCode, tempPhoneNumber } = useAuthStore.getState()
    const finalProfile = {
      name: profileData.fullName,
      phone: `${tempCountryCode.code} ${tempPhoneNumber}`,
      ...profileData,
    }
    setProfile(finalProfile)
    setIsAuthenticated(true)
    navigate({ to: ROUTES.DASHBOARD })
  }

  return (
    <div className="flex flex-col flex-1 px-6 pb-8 pt-4 w-full bg-[#FEFAF1] min-height-screen justify-between relative overflow-y-auto">
      {/* Top Header/Back Button */}
      <div className="h-12 flex items-center justify-between shrink-0">
        {['signup_phone', 'otp', 'profile'].includes(step) ? (
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
              onVerify={() => setStep('success')}
              onBack={() => setStep(authMode === 'signup' ? 'signup_phone' : 'signin')}
            />
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="flex-1 flex items-center justify-center">
          <SuccessCheck onComplete={() => {
            if (authMode === 'signin') {
              setProfile({
                name: 'Muhammad Huzaifa',
                phone: phone,
                email: 'huzaifa@example.com',
                occupation: 'Software Engineer',
                avatar: null,
              })
              setIsAuthenticated(true)
              navigate({ to: ROUTES.DASHBOARD })
            } else {
              setStep('profile')
            }
          }} />
        </div>
      )}

      {step === 'profile' && (
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <BrandLogo />
            <ProfileForm
              onSubmit={handleProfileSubmit}
            />
          </div>
        </div>
      )}
    </div>
  )
}
