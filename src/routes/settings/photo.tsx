import { createFileRoute } from '@tanstack/react-router'
import ProfilePicturePanel from '@/components/shared/profile-picture-panel'
import { useAuthStore } from '@/store/use-auth-store'
import { useUpdateProfileMutation } from '@/features/auth/api/use-auth-mutations'
import { mapUserToProfile } from '@/features/auth/api/map-user'

function UserPhotoRouteComponent() {
  const { userProfile, setProfile } = useAuthStore()
  const updateProfile = useUpdateProfileMutation()
  const initials = userProfile?.name
    ? userProfile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'MH'

  const handleSave = async (newAvatar: string | null) => {
    // Unchanged (re-confirmed the existing photo) or cleared — neither is
    // a real edit the multipart upload path below can express, so there's
    // nothing to send.
    if (!newAvatar || newAvatar === userProfile?.avatar) return

    const user = await updateProfile.mutateAsync({ avatar: newAvatar })
    setProfile(mapUserToProfile(user))
  }

  return (
    <ProfilePicturePanel
      currentAvatar={userProfile?.avatar || null}
      initials={initials}
      onClose={() => window.history.back()}
      onSave={handleSave}
    />
  )
}

export const Route = createFileRoute('/settings/photo')({
  component: UserPhotoRouteComponent,
})
