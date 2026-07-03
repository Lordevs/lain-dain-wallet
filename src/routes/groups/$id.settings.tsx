import { createFileRoute } from '@tanstack/react-router'
import GroupSettingsScreen from '@/features/groups/group-settings-screen'

export interface GroupSettingsSearch {
  drawer?: 'smart-settle' | 'recurring' | 'edit-name' | 'edit-photo'
  subDrawer?: 'add-recurring'
  edit?: string
}

export const Route = createFileRoute('/groups/$id/settings')({
  validateSearch: (search: Record<string, unknown>): GroupSettingsSearch => {
    return {
      drawer: (search.drawer === 'smart-settle' || search.drawer === 'recurring' || search.drawer === 'edit-name' || search.drawer === 'edit-photo') ? search.drawer : undefined,
      subDrawer: search.subDrawer === 'add-recurring' ? search.subDrawer : undefined,
      edit: typeof search.edit === 'string' ? search.edit : undefined,
    }
  },
  component: GroupSettingsScreen,
})

