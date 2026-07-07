import { createFileRoute } from '@tanstack/react-router'
import GroupDetailScreen from '@/features/groups/group-detail-screen'

export const Route = createFileRoute('/groups/$id/')({
  component: GroupDetailScreen,
})

