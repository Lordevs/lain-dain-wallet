import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

// Import sub-forms
import LoginForm from './login-form'
import PhoneForm from './phone-form'
import OtpForm from './otp-form'
import SuccessCheck from './success-check'
import ProfileForm from './profile-form'

// Import store
import { useAuthStore } from '@/store/use-auth-store'

type AuthStep = 'signin' | 'signup_phone' | 'otp' | 'success' | 'profile'

export default function AuthScreen() {
  const navigate = useNavigate()
  const { setProfile, setIsAuthenticated } = useAuthStore()

  const [step, setStep] = useState<AuthStep>('signin')
  const [phone, setPhone] = useState('') // Empty initially

  // Shared Brand Logo
  const BrandLogo = () => (
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

  const handleBack = () => {
    if (step === 'signup_phone') setStep('signin')
    else if (step === 'otp') setStep('signup_phone')
    else if (step === 'profile') setStep('otp')
  }

  const handlePhoneContinue = (enteredPhone: string) => {
    setPhone(enteredPhone)
    setStep('otp')
  }

  const handleProfileSubmit = (profileData: any) => {
    setProfile(profileData)
    setIsAuthenticated(true)
    navigate({ to: '/' })
  }

  const fadeSlideProps = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.22 }
  }

  return (
    <div className="flex flex-col flex-1 px-6 pb-8 pt-4 w-full bg-[#FEFAF1] min-height-screen justify-between relative overflow-y-auto">
      {/* Top Header/Back Button */}
      <div className="h-12 flex items-center justify-between shrink-0">
        {['signup_phone', 'otp', 'profile'].includes(step) ? (
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 active:scale-95 transition-all"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
        ) : (
          <div className="w-10 h-10"></div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 'signin' && (
          <motion.div key="signin" {...fadeSlideProps} className="flex-1 flex flex-col justify-between">
            <div>
              <BrandLogo />
              <LoginForm
                onSuccess={() => {
                  setIsAuthenticated(true)
                  navigate({ to: '/' })
                }}
                onGoToSignUp={() => setStep('signup_phone')}
              />
            </div>
          </motion.div>
        )}

        {step === 'signup_phone' && (
          <motion.div key="signup" {...fadeSlideProps} className="flex-1 flex flex-col justify-between">
            <div>
              <BrandLogo />
              <PhoneForm
                initialPhone={phone}
                onContinue={handlePhoneContinue}
                onBack={() => setStep('signin')}
              />
            </div>
          </motion.div>
        )}

        {step === 'otp' && (
          <motion.div key="otp" {...fadeSlideProps} className="flex-1 flex flex-col justify-between">
            <div>
              <BrandLogo />
              <OtpForm
                phoneNumber={phone}
                onVerify={() => setStep('success')}
                onBack={() => setStep('signup_phone')}
              />
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="success" {...fadeSlideProps} className="flex-1 flex items-center justify-center">
            <SuccessCheck onComplete={() => setStep('profile')} />
          </motion.div>
        )}

        {step === 'profile' && (
          <motion.div key="profile" {...fadeSlideProps} className="flex-1 flex flex-col justify-between">
            <div>
              <BrandLogo />
              <ProfileForm
                onSubmit={handleProfileSubmit}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
