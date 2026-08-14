import { useCallback } from 'react'
import { useCanGoBack, useRouter } from '@tanstack/react-router'
import { parentPath } from '@/lib/navigation-hierarchy'

export function useHierarchyBack() {
  const router = useRouter()
  const canGoBack = useCanGoBack()

  return useCallback(() => {
    if (canGoBack) {
      router.history.back()
      return
    }

    // A structural parent is only a fallback for a direct entry/deep link
    // whose in-app history index is zero.
    const parent = parentPath(router.state.location.pathname)
    if (parent) {
      void router.navigate({ to: parent, replace: true } as never)
    }
  }, [canGoBack, router])
}
