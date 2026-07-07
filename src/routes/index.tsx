import { createFileRoute } from '@tanstack/react-router'
import App from '@/App'
import { z } from 'zod'

const dashboardSearchSchema = z.object({
  search: z.string().optional(),
})

export const Route = createFileRoute('/')({
  validateSearch: dashboardSearchSchema,
  component: App,
})
