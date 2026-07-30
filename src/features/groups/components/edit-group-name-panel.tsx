import { useState } from 'react'
import { useParams, Navigate } from '@tanstack/react-router'
import FlowHeader from '@/components/shared/flow-header'
import FormError from '@/components/shared/form-error'
import { useAuthStore } from '@/store/use-auth-store'
import { useGroupQuery } from '@/features/groups/api/use-group-query'
import { useUpdateGroupMutation } from '@/features/groups/api/use-update-group-mutation'
import { getGroupPermissions } from '@/features/groups/lib/group-roles'
import type { components } from '@/lib/api/schema'

type Group = components['schemas']['Group']

/** Edit group info (name + description) standalone screen.
 * Route: /groups/$id/settings/name */
export default function EditGroupNamePanel() {
  const { id } = useParams({ from: '/groups/$id/settings/name' })

  const userProfile = useAuthStore((state) => state.userProfile)
  const myId = userProfile?.id ?? ''

  const groupQuery = useGroupQuery(id)
  const group = groupQuery.data

  if (groupQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[#FEFAF1] flex items-center justify-center">
        <p className="text-sm text-[#6B6B6B]">Loading…</p>
      </div>
    )
  }

  const { isAdmin } = getGroupPermissions(group, myId)

  if (!group || !isAdmin) {
    return <Navigate to="/groups/$id/settings" params={{ id }} replace />
  }

  // Mounted only once the group is loaded, so its own useState lazy
  // initializer picks up the real name/description on first render.
  return <EditGroupNameForm id={id} group={group} />
}

function EditGroupNameForm({ id, group }: { id: string; group: Group }) {
  const [name, setName] = useState(group.name ?? '')
  const [description, setDescription] = useState(group.description ?? '')

  const updateGroup = useUpdateGroupMutation(id)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    await updateGroup.mutateAsync({
      name: trimmedName,
      description: description.trim(),
    })
    window.history.back()
  }

  return (
    <div className="min-h-screen bg-[#FEFAF1] flex flex-col select-none overflow-y-auto text-[#1A1A1A]">
      <FlowHeader
        title="Edit Group Info"
        onBack={() => window.history.back()}
      />

      <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between px-6 pb-8 pt-2">
        <div className="space-y-5">
          {/* Group Name */}
          <div className="space-y-1.5 text-left mt-4">
            <label className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase px-1">
              Group Name
            </label>
            <div className="bg-white border-[0.8px] border-[#E8E4DC] focus-within:border-[#0B683A73] rounded-[16px] px-5 py-4 transition-all shadow-[0px_2px_10px_0px_rgba(0,0,0,0.05)]">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="outline-none border-0 w-full text-[15px] font-medium text-[#1A1A1A] p-0 bg-transparent"
                required
                maxLength={150}
                placeholder="Enter group name"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase px-1">
              Description <span className="text-[#9A9590] normal-case font-normal">(optional)</span>
            </label>
            <div className="bg-white border-[0.8px] border-[#E8E4DC] focus-within:border-[#0B683A73] rounded-[16px] px-5 py-3.5 transition-all shadow-[0px_2px_10px_0px_rgba(0,0,0,0.05)]">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Add a short description…"
                className="outline-none border-0 w-full text-[15px] font-medium text-[#1A1A1A] p-0 bg-transparent resize-none leading-relaxed"
              />
            </div>
            <p className="text-[11px] text-[#9A9590] px-1 text-right">
              {description.length}/500
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8">
          <FormError message={updateGroup.error?.message} className="mb-4 justify-center" />
          <button
            type="submit"
            disabled={updateGroup.isPending || !name.trim()}
            className="w-full h-14 bg-positive text-white rounded-full font-bold text-base shadow-[0px_8px_20px_rgba(11,104,58,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer border-0"
          >
            {updateGroup.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
