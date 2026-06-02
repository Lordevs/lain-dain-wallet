import type { ReactNode } from 'react'
import { useAuthStore } from '@/store/use-auth-store'
import BottomNav from './bottom-nav'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="flex flex-col min-h-dvh w-full bg-[#FEFAF1] relative">
      {/* Scrollable content area */}
      <main className={`flex-1 flex flex-col overflow-y-auto ${isAuthenticated ? 'pb-[76px]' : ''}`}>
        {children}
      </main>

      {/* Fixed bottom navigation */}
      {isAuthenticated && <BottomNav />}
    </div>
  )
}
