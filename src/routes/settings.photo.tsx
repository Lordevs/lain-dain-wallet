import { createFileRoute } from '@tanstack/react-router'
import ProfilePicturePanel from '@/components/shared/profile-picture-panel'
import { useAuthStore } from '@/store/use-auth-store'

function UserPhotoRouteComponent() {
  const { userProfile, setProfile } = useAuthStore()
  const initials = userProfile?.name
    ? userProfile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'MH'

  return (
    <ProfilePicturePanel
      currentAvatar={userProfile?.avatar || null}
      initials={initials}
      onClose={() => window.history.back()}
      onSave={(newAvatar) => {
        setProfile({ ...userProfile, avatar: newAvatar })
        window.history.back()
      }}
    />
  )
}

export const Route = createFileRoute('/settings/photo')({
  component: UserPhotoRouteComponent,
})
