import { createFileRoute, useParams } from '@tanstack/react-router'
import ProfilePicturePanel from '@/components/shared/profile-picture-panel'
import { useContactStore } from '@/store/use-contact-store'

function GroupPhotoRouteComponent() {
  const { id } = useParams({ from: '/groups/$id/settings/photo' })
  const contacts = useContactStore((state) => state.contacts)
  const contact = contacts.find((c) => c.id === id)
  const updateContact = useContactStore((state) => state.updateContact)

  if (!contact) return null

  const groupInitials = contact.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <ProfilePicturePanel
      title="Group Image"
      label="Current group photo"
      initials={groupInitials}
      currentAvatar={contact.avatar || null}
      onClose={() => window.history.back()}
      onSave={(newPhoto) => {
        updateContact(contact.id, { avatar: newPhoto })
        window.history.back()
      }}
    />
  )
}

export const Route = createFileRoute('/groups/$id/settings/photo')({
  component: GroupPhotoRouteComponent,
})
