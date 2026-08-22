import FlowHeader from '@/components/shared/flow-header'

const sections = [
  {
    title: 'Information we collect',
    body: 'We collect your phone number and profile information, including your name, profile picture, date of birth, gender, and preferred currency when you provide them. We also store the groups, expenses, balances, settlements, recurring payments, notes, and other ledger information you create in Lain Dain.',
  },
  {
    title: 'Contacts and phone-number matching',
    body: 'If you give contact permission, Lain Dain uploads a snapshot of contact names and phone numbers so you can find people who already use the app. Contact values are encrypted, and protected phone-number hashes are used for matching. Syncing replaces the previous snapshot, including removing contacts you deleted from your phone. We do not use your contacts for advertising.',
  },
  {
    title: 'Receipts and uploaded files',
    body: 'You may optionally upload profile pictures, group pictures, receipts, and issue-report screenshots. Private financial files are stored with restricted access and are shared only with people who are allowed to view the related ledger or report.',
  },
  {
    title: 'Notifications and Firebase',
    body: 'If you enable notifications, we store a device push token and use Google Firebase Cloud Messaging to deliver group invitations, payment activity, reminders, and security or service messages. Firebase processes the token and delivery information according to Google’s privacy terms.',
  },
  {
    title: 'How we use information',
    body: 'We use this information to authenticate you, match contacts, operate shared and personal ledgers, calculate balances, process settlements, deliver reminders and notifications, provide support, prevent abuse, and maintain the security and reliability of the service. We do not sell your personal information.',
  },
  {
    title: 'Sharing',
    body: 'Your profile and relevant ledger activity are visible to the people with whom you share a contact ledger or group. We may use service providers for hosting, private file storage, notifications, security, and app operation. They may process only the information needed to provide those services.',
  },
  {
    title: 'Retention and deletion',
    body: 'We retain information while your account is active and as needed to operate the service, resolve disputes, prevent fraud, and meet legal obligations. Deleted receipts and other unneeded uploaded files are removed from storage. Some ledger metadata may remain where other users’ transaction history, audit integrity, or legal obligations depend on it.',
  },
  {
    title: 'Delete your account',
    body: 'Before deleting your account, you must clear any pending settlements. Once all settlements are resolved, you can request account deletion inside the app from Settings → Delete Account. Account access, sessions, and active push registrations are removed or disabled as part of deletion. Information that must remain for shared ledger integrity or legal compliance may be retained in a limited form.',
  },
  {
    title: 'Your choices and contact',
    body: 'You can decline contact and notification permissions, remove optional files, edit your profile, or delete your account. For privacy questions or requests, use Settings → Report an Issue in the app.',
  },
]

export default function PrivacyPolicyScreen() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#FEFAF1] pb-10 text-left">
      <FlowHeader
        title="Privacy Policy"
        onBack={() => window.history.back()}
      />

      <main className="mx-auto w-full max-w-2xl px-6 pb-10">
        <p className="mt-2 text-xs font-semibold text-[#8A847D]">Effective August 14, 2026</p>
        <p className="mt-4 text-sm leading-6 text-[#4A4A4A]">
          This policy explains how Lain Dain collects, uses, stores, and shares information when you use the mobile application.
        </p>

        <div className="mt-7 space-y-6">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-base font-extrabold text-[#044327]">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#4A4A4A]">{section.body}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
