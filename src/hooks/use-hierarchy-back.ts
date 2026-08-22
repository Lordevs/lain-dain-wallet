import { useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import { navigateBackInHierarchy } from '@/lib/navigation-hierarchy'

export function useHierarchyBack() {
  const router = useRouter()

  return useCallback(() => {
    navigateBackInHierarchy(router)
  }, [router])
}
