import type { components } from '@/lib/api/schema'
import type { UserProfile } from '@/store/use-auth-store'

export function mapUserToProfile(user: components['schemas']['User']): UserProfile {
  return {
    id: user.id,
    name: user.full_name || undefined,
    phone: user.phone_number,
    dateOfBirth: user.date_of_birth ?? undefined,
    gender: user.gender || undefined,
    country: user.country || undefined,
    email: user.email ?? undefined,
    occupation: user.occupation || undefined,
    avatar: user.image ?? null,
    profileComplete: user.profile_complete,
    defaultCurrency: user.default_currency,
  }
}
