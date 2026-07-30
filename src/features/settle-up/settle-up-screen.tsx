import { useSearch } from '@tanstack/react-router'
import ContactSettleUpForm from './contact-settle-up-form'
import GroupSettleUpForm from './group-settle-up-form'

/** Dispatches to the right settle-up form based on which id arrived —
 * contactId (a real User.id) for a 1:1 friendship, or groupId for a
 * group's batch settle-up. `notificationId`-only navigation (from the
 * still-mock notifications list) has nothing real to settle yet — that's
 * tied to the confirm/dispute phase, not this pass. */
export default function SettleUpScreen() {
  const { contactId, groupId } = useSearch({ from: '/settle-up' })

  if (contactId) {
    return <ContactSettleUpForm userId={contactId} />
  }
  if (groupId) {
    return <GroupSettleUpForm groupId={groupId} />
  }

  return (
    <div className="flex items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
      <div className="text-center">
        <p className="text-lg font-bold text-[#1A1A1A]">Nothing to settle</p>
        <button
          onClick={() => window.history.back()}
          className="mt-4 px-4 py-2 bg-positive text-white rounded-full font-bold border-0 cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  )
}
