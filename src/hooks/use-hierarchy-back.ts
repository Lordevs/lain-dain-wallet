import { useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import { parentPath } from '@/lib/navigation-hierarchy'

export function useHierarchyBack() {
  const router = useRouter()

  return useCallback(() => {
    const parent = parentPath(router.state.location.pathname)
    if (parent) {
      void router.navigate({ to: parent, replace: true } as never)
    }
  }, [router])
}
