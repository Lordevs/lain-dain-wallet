import { create } from 'zustand'

export interface CountryCode {
  code: string
  flag: string
  name: string
}

export interface UserProfile {
  age?: string
  gender?: string
  email?: string
  occupation?: string
  maritalStatus?: string
  avatar?: string | null
}

interface AuthState {
  // Shared registration states
  tempPhoneNumber: string
  tempCountryCode: CountryCode
  setRegistrationPhone: (phone: string, code: CountryCode) => void

  // User state
  isAuthenticated: boolean
  userProfile: UserProfile | null
  setProfile: (profile: UserProfile) => void
  setIsAuthenticated: (auth: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  tempPhoneNumber: '3219988776',
  tempCountryCode: { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
  setRegistrationPhone: (phone, code) =>
    set({ tempPhoneNumber: phone, tempCountryCode: code }),

  isAuthenticated: false,
  userProfile: null,
  setProfile: (profile) => set({ userProfile: profile }),
  setIsAuthenticated: (auth) => set({ isAuthenticated: auth }),
  logout: () => set({ isAuthenticated: false, userProfile: null })
}))
