import { MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FlowHeader from '@/components/shared/flow-header'
import { useNewContactFlow } from './hooks/use-new-contact-flow'
import ChoiceStep from './components/choice-step'
import AddMembersStep from './components/add-members-step'
import GroupDetailsStep from './components/group-details-step'
import GroupSuccessStep from './components/group-success-step'
import type { NewFlowStep } from './types'

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_TITLES: Record<NewFlowStep, string> = {
  choice: 'New Lain Dain',
  add_members: 'Add Members',
  group_details: 'Group Details',
  success: '',
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * NewContactScreen — thin orchestrator for the New Contact / New Group flow.
 *
 * Responsibilities:
 *  1. Owns the flow state via `useNewContactFlow`.
 *  2. Renders the shared FlowHeader.
 *
 * All business logic lives in `useNewContactFlow`.
 * All UI lives in the individual step components.
 */
export default function NewContactScreen() {
  const flow = useNewContactFlow()

  return (
    <div className="flex flex-col flex-1 bg-background h-screen overflow-hidden text-foreground">
      {/* Header */}
      <FlowHeader
        title={STEP_TITLES[flow.step]}
        onBack={flow.goBack}
        rightSlot={
          flow.step === 'add_members' ? (
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 text-muted-foreground bg-transparent border-0 cursor-pointer outline-none hover:bg-hover-bg rounded-full flex items-center justify-center"
            >
              <MoreVertical size={18} />
            </Button>
          ) : undefined
        }
      />

      {flow.step === 'choice' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChoiceStep flow={flow} />
        </div>
      )}

      {flow.step === 'add_members' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <AddMembersStep flow={flow} />
        </div>
      )}

      {flow.step === 'group_details' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <GroupDetailsStep flow={flow} />
        </div>
      )}

      {flow.step === 'success' && (
        <div className="flex-1 flex flex-col">
          <GroupSuccessStep flow={flow} />
        </div>
      )}
    </div>
  )
}
