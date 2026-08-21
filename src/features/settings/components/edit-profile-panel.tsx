import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Pencil, User } from 'lucide-react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import FlowHeader from '@/components/shared/flow-header'
import FormError from '@/components/shared/form-error'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/use-auth-store'
import { ROUTES } from '@/constants/routes'
import { useUpdateProfileMutation } from '@/features/auth/api/use-auth-mutations'
import { mapUserToProfile } from '@/features/auth/api/map-user'
import { cn } from '@/lib/utils'

interface EditProfilePanelProps {
  onClose?: () => void
  onSuccess?: (msg: string) => void
}

interface FormValues {
  fullName: string
  email: string
}

// Backend field names (snake_case, from the DRF error body) → this form's
// own field names — lets a server-side error (e.g. "email" already taken)
// land on the exact input that caused it via setError, instead of only
// showing as a generic banner.
const BACKEND_FIELD_TO_FORM_FIELD: Record<string, keyof FormValues> = {
  full_name: 'fullName',
  email: 'email',
}

export default function EditProfilePanel({
  onClose = () => window.history.back(),
  onSuccess,
}: EditProfilePanelProps) {
  const navigate = useNavigate()
  const { userProfile, setProfile } = useAuthStore()
  const updateProfile = useUpdateProfileMutation()

  // Prefilled from the store, then edited locally — deliberately NOT
  // synced back to the store on every keystroke (an earlier version did
  // that), which let an unsaved edit leak into every other screen reading
  // the store before it was ever sent to the backend. The store only
  // updates once the save actually succeeds, from the server's response.
  const { control, handleSubmit, setError } = useForm<FormValues>({
    defaultValues: {
      fullName: userProfile?.name ?? '',
      email: userProfile?.email ?? '',
    },
  })

  useEffect(() => {
    if (!updateProfile.error) return
    for (const [backendField, message] of Object.entries(updateProfile.error.fields)) {
      const formField = BACKEND_FIELD_TO_FORM_FIELD[backendField]
      if (formField) setError(formField, { type: 'server', message })
    }
  }, [updateProfile.error, setError])

  // Only the bottom banner is shown for errors that don't map onto a
  // specific field — once a field-level message is showing under its own
  // input, repeating it in a banner too would just be the same sentence twice.
  const hasFieldErrors = !!updateProfile.error && Object.keys(updateProfile.error.fields).length > 0

  const avatar = userProfile?.avatar || null
  const name = useWatch({ control, name: 'fullName' })

  const onFormSubmit = async (values: FormValues) => {
    updateProfile.mutate({ fullName: values.fullName.trim(), email: values.email.trim() }, {
      onSuccess: (user) => {
        setProfile(mapUserToProfile(user))
        onSuccess?.('Profile updated successfully!')
        onClose()
      },
    })
  }

  const initials = name
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#FEFAF1] text-[#1A1A1A] select-none">
      <FlowHeader
        title="Edit Profile"
        onBack={onClose}
      />

      <form onSubmit={handleSubmit(onFormSubmit)} className="flex min-h-0 flex-1 flex-col justify-between px-6 pb-5 pt-1">
        <div className="space-y-[clamp(16px,2.8vh,24px)]">
          {/* Avatar / Photo Uploader */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="size-[clamp(72px,11vh,88px)] select-none shadow-[0px_6px_20px_0px_#0B683A52]">
                {avatar ? (
                  <AvatarImage src={avatar} alt="Profile Picture" className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-[linear-gradient(140deg,#0B683A_3.67%,#14A558_96.33%)] text-white font-bold text-[28px] tracking-tight">
                    {initials || <User size={32} />}
                  </AvatarFallback>
                )}
              </Avatar>

              {/* Pencil Icon Button */}
              <button
                type="button"
                onClick={() => navigate({ to: ROUTES.USER_PHOTO })}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-positive text-white border-2 border-white flex items-center justify-center shadow-md cursor-pointer active:scale-95 transition-all"
                aria-label="Upload profile image"
              >
                <Pencil size={14} className="stroke-[2.5px]" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate({ to: ROUTES.USER_PHOTO })}
              className="mt-2 block cursor-pointer text-center text-[clamp(13px,3.8vw,15px)] font-semibold text-positive"
            >
              Change Profile Icon
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-[clamp(12px,2vh,16px)] text-left">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase px-1">
                Full Name
              </label>
              <Controller
                name="fullName"
                control={control}
                rules={{ required: 'Full name is required' }}
                render={({ field, fieldState }) => (
                  <>
                    <div
                      className={cn(
                        'bg-white border-[0.8px] focus-within:border-[#0B683A73] rounded-[16px] px-5 py-[clamp(12px,1.8vh,16px)] transition-all shadow-[0px_2px_10px_0px_rgba(0,0,0,0.03)]',
                        fieldState.error ? 'border-tertiary' : 'border-[#E8E4DC]'
                      )}
                    >
                      <input
                        {...field}
                        type="text"
                        className="outline-none border-0 w-full text-[15px] font-medium text-[#1A1A1A] p-0 bg-transparent"
                        placeholder="Enter your name"
                      />
                    </div>
                    {fieldState.error && (
                      <p className="text-xs font-medium text-tertiary px-1 mt-1">{fieldState.error.message}</p>
                    )}
                  </>
                )}
              />
            </div>

            {/* Phone Number (Verified, Read-Only) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase px-1">
                Phone Number
              </label>
              <div className="flex items-center justify-between bg-white border-[0.8px] border-[#E8E4DC] rounded-[16px] px-5 py-[clamp(12px,1.8vh,16px)] shadow-[0px_2px_10px_0px_rgba(0,0,0,0.03)]">
                <span className="text-[15px] font-medium text-[#1A1A1A]">
                  {userProfile?.phone}
                </span>
                <span className="bg-[#E4F2EB] text-positive text-[12px] font-bold px-3 py-1 rounded-full shrink-0 select-none">
                  Verified
                </span>
              </div>
            </div>

            {/* Email (Optional) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase px-1">
                Email <span className='text-[#9A9590] font-normal'>(Optional)</span>
              </label>
              <Controller
                name="email"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <div
                      className={cn(
                        'bg-white border-[0.8px] focus-within:border-[#0B683A73] rounded-[16px] px-5 py-[clamp(12px,1.8vh,16px)] transition-all shadow-[0px_2px_10px_0px_rgba(0,0,0,0.03)]',
                        fieldState.error ? 'border-tertiary' : 'border-[#E8E4DC]'
                      )}
                    >
                      <input
                        {...field}
                        type="email"
                        className="outline-none border-0 w-full text-[15px] font-medium text-[#1A1A1A] p-0 bg-transparent"
                        placeholder="Add email address..."
                      />
                    </div>
                    {fieldState.error && (
                      <p className="text-xs font-medium text-tertiary px-1 mt-1">{fieldState.error.message}</p>
                    )}
                  </>
                )}
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Changes Button */}
        <div className="mt-4 shrink-0 pt-2">
          {!hasFieldErrors && (
            <FormError message={updateProfile.error?.message} className="mb-4 justify-center" />
          )}
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-positive text-[clamp(14px,4vw,16px)] font-bold text-white shadow-[0px_8px_20px_rgba(11,104,58,0.3)] transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

    </div>
  )
}
