import { createFileRoute } from '@tanstack/react-router'
import PrivacyPolicyScreen from '@/features/settings/privacy-policy-screen'

export const Route = createFileRoute('/privacy-policy')({
  component: PrivacyPolicyScreen,
})
