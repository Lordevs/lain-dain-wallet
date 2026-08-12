import { createFileRoute, useNavigate } from '@tanstack/react-router'
import BrandLogo from '@/components/shared/brand-logo'
import ProfileForm, { type ProfileFormData } from '@/features/auth/components/profile-form'
import { useAuthStore } from '@/store/use-auth-store'
import { ROUTES } from '@/constants/routes'
import { useUpdateProfileMutation } from '@/features/auth/api/use-auth-mutations'
import { buildProfileFormData } from '@/features/auth/api/build-profile-form-data'
import { mapUserToProfile } from '@/features/auth/api/map-user'

// Only reachable when authenticated with an incomplete profile — see
// __root.tsx's beforeLoad. There's deliberately no way back to /auth from
// here: tokens are already issued by this point, so re-verifying a phone
// number that's already proven owned would be pointless, not safer.
function OnboardingComponent() {
  const navigate = useNavigate()
  const { setProfile } = useAuthStore()
  const updateProfile = useUpdateProfileMutation()

  const handleSubmit = async (profileData: ProfileFormData) => {
    const formData = await buildProfileFormData(profileData)
    updateProfile.mutate(formData, {
      onSuccess: (user) => {
        setProfile(mapUserToProfile(user))
        navigate({ to: ROUTES.DASHBOARD })
      },
    })
  }

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col justify-between overflow-y-auto overscroll-contain bg-[#FEFAF1] px-4 pt-3 pb-6 sm:px-6 sm:pt-4 sm:pb-8">
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <BrandLogo />
          <ProfileForm
            onSubmit={handleSubmit}
            isSubmitting={updateProfile.isPending}
            submitError={updateProfile.error ?? null}
          />
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/onboarding')({
  component: OnboardingComponent,
})
