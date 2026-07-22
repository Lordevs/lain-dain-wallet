import { COUNTRY_NAME_TO_CODE } from '@/features/auth/api/country-codes'
import type { ProfileFormData } from '@/features/auth/components/profile-form'

/**
 * Converts the profile form's UI-shaped data into a multipart FormData
 * body for PATCH /api/auth/profile/ — gender is lowercased to match
 * GenderEnum, country is mapped from its display name to an ISO code
 * (django_countries doesn't accept arbitrary display names), and the
 * avatar (a local webPath/blob URL, not yet a real file) is fetched into
 * a Blob so it can be attached as a real upload.
 */
export async function buildProfileFormData(data: ProfileFormData): Promise<FormData> {
  const formData = new FormData()

  if (data.fullName) formData.append('full_name', data.fullName)
  if (data.dateOfBirth) formData.append('date_of_birth', data.dateOfBirth)
  if (data.gender) formData.append('gender', data.gender.toLowerCase())
  if (data.country) formData.append('country', COUNTRY_NAME_TO_CODE[data.country] ?? data.country)
  if (data.occupation) formData.append('occupation', data.occupation)
  if (data.email) formData.append('email', data.email)

  if (data.avatar) {
    const blob = await fetch(data.avatar).then((res) => res.blob())
    formData.append('image', blob, 'avatar.jpg')
  }

  return formData
}
