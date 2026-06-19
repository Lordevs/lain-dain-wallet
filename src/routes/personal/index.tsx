import { createFileRoute } from '@tanstack/react-router'
import PersonalScreen from '@/features/personal/personal-screen'

export interface PersonalSearch {
  drawer?: 'add-expense'
}

export const Route = createFileRoute('/personal/')({
  validateSearch: (search: Record<string, unknown>): PersonalSearch => {
    return {
      drawer: search.drawer === 'add-expense' ? search.drawer : undefined,
    }
  },
  component: PersonalScreen,
})

