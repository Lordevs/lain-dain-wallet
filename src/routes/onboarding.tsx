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
    <div className="flex flex-col flex-1 px-6 pb-8 pt-4 w-full bg-[#FEFAF1] min-height-screen justify-between relative overflow-y-auto">
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <BrandLogo />
          <ProfileForm
            onSubmit={handleSubmit}
            isSubmitting={updateProfile.isPending}
            submitError={updateProfile.error?.message ?? null}
          />
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/onboarding')({
  component: OnboardingComponent,
})
