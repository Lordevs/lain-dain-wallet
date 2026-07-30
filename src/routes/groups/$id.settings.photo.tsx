import { createFileRoute, useParams, Navigate } from '@tanstack/react-router'
import ProfilePicturePanel from '@/components/shared/profile-picture-panel'
import { useAuthStore } from '@/store/use-auth-store'
import { useGroupQuery } from '@/features/groups/api/use-group-query'
import { useUpdateGroupMutation } from '@/features/groups/api/use-update-group-mutation'
import { initialsForName } from '@/lib/avatar-visuals'

function GroupPhotoRouteComponent() {
  const { id } = useParams({ from: '/groups/$id/settings/photo' })

  const userProfile = useAuthStore((state) => state.userProfile)
  const myId = userProfile?.id ?? ''

  const groupQuery = useGroupQuery(id)
  const group = groupQuery.data

  const updateGroup = useUpdateGroupMutation(id)

  if (groupQuery.isLoading) return null

  const myMember = group?.members.find((m) => m.id === myId)
  const isAdmin = myMember?.role === 'admin' || group?.created_by === myId

  if (!group || !isAdmin) {
    return <Navigate to="/groups/$id/settings" params={{ id }} replace />
  }

  const groupInitials = initialsForName(group.name).slice(0, 2)

  const handleSave = async (newPhoto: string | null) => {
    // No change (re-confirmed existing) — nothing to send
    if (newPhoto === (group.image ?? null)) return
    await updateGroup.mutateAsync({ image: newPhoto })
  }

  return (
    <ProfilePicturePanel
      title="Group Image"
      label="Current group photo"
      initials={groupInitials}
      currentAvatar={group.image ?? null}
      onClose={() => window.history.back()}
      onSave={handleSave}
    />
  )
}

export const Route = createFileRoute('/groups/$id/settings/photo')({
  component: GroupPhotoRouteComponent,
})
