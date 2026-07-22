import { create } from 'zustand'

export interface UserProfile {
  id?: string
  name?: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  country?: string
  email?: string
  occupation?: string
  avatar?: string | null
  // Mirrors backend User.profile_complete — drives whether __root.tsx's
  // route guard lets an authenticated user reach the app or keeps them on
  // /auth to finish onboarding (see routes/__root.tsx beforeLoad).
  profileComplete?: boolean
}

interface AuthState {
  // In-memory only, never persisted — a cold start re-derives this from
  // the refresh token (see src/lib/secure-storage.ts + src/lib/api/client.ts),
  // it's never written to disk itself.
  accessToken: string | null
  setAccessToken: (token: string | null) => void

  // User state
  isAuthenticated: boolean
  userProfile: UserProfile | null
  setProfile: (profile: UserProfile) => void
  setIsAuthenticated: (auth: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),

  isAuthenticated: false,
  userProfile: null,
  setProfile: (profile) => set({ userProfile: profile }),
  setIsAuthenticated: (auth) => set({ isAuthenticated: auth }),
  logout: () => set({ isAuthenticated: false, userProfile: null, accessToken: null }),
}))
