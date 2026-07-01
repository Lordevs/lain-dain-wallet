import { createFileRoute } from '@tanstack/react-router'
import PersonalCategoriesScreen from '@/features/personal/categories-screen'

export const Route = createFileRoute('/personal/categories')({
  component: PersonalCategoriesScreen,
})
