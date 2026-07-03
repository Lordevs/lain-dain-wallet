import { createFileRoute } from '@tanstack/react-router'
import SettingsScreen from '@/features/settings/settings-screen'

import { z } from 'zod'

const searchSchema = z.object({
  subPanel: z.enum(['edit-profile', 'report-issue', 'logout', 'delete-account']).optional(),
  editPhoto: z.boolean().optional(),
})

export const Route = createFileRoute('/settings')({
  validateSearch: searchSchema,
  component: SettingsScreen,
})
