// Invites are entirely client-side by design (see apps/contacts' docs) —
// the backend has no memory of who was invited or when. This just hands
// off to whatever share surface the platform actually has; there's no
// invite-tracking state to update afterward either way.
export async function shareInvite(displayName: string): Promise<void> {
  const firstName = displayName.trim().split(/\s+/)[0] || 'there'
  const message = `Hey ${firstName}! I'm using Lain Dain to split expenses and settle up with friends — thought you'd want in. Search for "Lain Dain" on the App Store or Play Store.`

  if (navigator.share) {
    try {
      await navigator.share({ text: message })
    } catch {
      // User dismissed the share sheet — not an error.
    }
    return
  }

  // wa.me with no phone number opens WhatsApp's own contact picker for the
  // message — the same "OS share sheet" fallback the architecture docs
  // describe, for browsers/platforms without the Web Share API.
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
}
