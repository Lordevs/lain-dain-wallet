import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useContactStore } from '@/store/use-contact-store'
import FlowHeader from '@/components/shared/flow-header'

/** Edit group name standalone screen. */
export default function EditGroupNamePanel() {
  const { id } = useParams({ from: '/groups/$id/settings/name' })
  const contacts = useContactStore((state) => state.contacts)
  const contact = contacts.find((c) => c.id === id)
  const updateContact = useContactStore((state) => state.updateContact)

  const [tempGroupName, setTempGroupName] = useState(contact?.name || '')

  if (!contact) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tempGroupName.trim()) return
    updateContact(contact.id, { name: tempGroupName.trim() })
    window.history.back()
  }

  const handleBack = () => {
    window.history.back()
  }

  return (
    <div className="min-h-screen bg-[#FEFAF1] flex flex-col select-none overflow-y-auto text-[#1A1A1A]">
      <FlowHeader
        title="Edit Group Name"
        onBack={handleBack}
      />

      <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between px-6 pb-8 pt-2">
        <div className="space-y-6">
          {/* Name Input */}
          <div className="space-y-1.5 text-left mt-4">
            <label className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase px-1">
              Group Name
            </label>
            <div className="bg-white border-[0.8px] border-[#E8E4DC] focus-within:border-[#0B683A73] rounded-[16px] px-5 py-4 transition-all shadow-[0px_2px_10px_0px_rgba(0,0,0,0.05)]">
              <input
                type="text"
                value={tempGroupName}
                onChange={(e) => setTempGroupName(e.target.value)}
                className="outline-none border-0 w-full text-[15px] font-medium text-[#1A1A1A] p-0 bg-transparent"
                required
                placeholder="Enter group name"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div>
          <button
            type="submit"
            className="w-full h-14 bg-positive text-white rounded-full font-bold text-base shadow-[0px_8px_20px_rgba(11,104,58,0.3)] active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
          >
            Save Name
          </button>
        </div>
      </form>
    </div>
  )
}
