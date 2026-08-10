// Invites are entirely client-side by design (see apps/contacts' docs) —
// the backend has no memory of who was invited or when. Open the selected
// person's WhatsApp conversation directly instead of displaying the generic
// OS share sheet/contact picker.
export function shareInvite(displayName: string, phoneNumber: string): void {
  const firstName = displayName.trim().split(/\s+/)[0] || 'there'
  const message = `Hey ${firstName}! I'm using Lain Dain to split expenses and settle up with friends — thought you'd want in. Search for "Lain Dain" on the App Store or Play Store.`
  // wa.me requires an international number containing digits only (no '+',
  // spaces, brackets, or dashes). Device contacts are already normalized to
  // E.164, but sanitizing here also makes server-sourced contacts safe.
  const whatsappNumber = phoneNumber.replace(/\D/g, '')

  // WhatsApp intentionally requires the user to press Send; third-party apps
  // cannot silently send a message on their behalf. This universal link opens
  // the exact chat with the invitation prefilled in WhatsApp when installed,
  // and falls back to WhatsApp Web otherwise.
  window.open(
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
    '_blank',
    'noopener,noreferrer',
  )
}
