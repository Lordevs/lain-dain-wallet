import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LoginFormProps {
  onSuccess: () => void
  onGoToSignUp: () => void
}

export default function LoginForm({ onSuccess, onGoToSignUp }: LoginFormProps) {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSuccess()
  }

  return (
    <div className="flex-1 flex flex-col justify-between w-full">
      <div>
        <div className="mb-6 text-left">
          <h2 className="text-xl font-bold text-foreground leading-tight">Welcome Back</h2>
          <p className="text-muted-foreground mt-0.5 text-base">Sign in to manage your ledgers</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground px-1">
              Phone number
            </Label>
            <Input
              type="tel"
              placeholder="Enter your Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-14 px-6 rounded-full border-[0.8px] border-[#FFF6EF] bg-white! text-foreground text-[15px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground px-1">
              Password
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 pl-6 pr-14 rounded-full border-[0.8px] border-[#FFF6EF] bg-white! text-foreground text-[15px]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <button type="button" className="text-primary text-sm font-medium hover:underline">
              Forgot password?
            </button>
          </div>

          <div className="pt-8 space-y-6">
            <Button
              type="submit"
              className="w-full h-14 bg-primary text-white rounded-full font-bold text-base shadow-[0px_7.03px_23.42px_0px_rgba(11,104,58,0.35)] hover:bg-primary/95 transition-all"
            >
              Sign In
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onGoToSignUp}
                className="text-primary font-semibold hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
