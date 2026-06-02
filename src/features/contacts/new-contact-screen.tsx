import { MoreVertical } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

const slideVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.22 },
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * NewContactScreen — thin orchestrator for the New Contact / New Group flow.
 *
 * Responsibilities:
 *  1. Owns the flow state via `useNewContactFlow`.
 *  2. Renders the shared FlowHeader (hidden on success screen).
 *  3. Animates between the 4 step components with framer-motion.
 *
 * All business logic lives in `useNewContactFlow`.
 * All UI lives in the individual step components.
 */
export default function NewContactScreen() {
  const flow = useNewContactFlow()

  const getStepSubtitle = () => {
    if (flow.step === 'add_members') {
      return `${flow.selectedContacts.length} selected`
    }
    if (flow.step === 'group_details') {
      return `${flow.selectedContacts.length} members`
    }
    return undefined
  }

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen relative select-none overflow-hidden">
      {/* Header — hidden on success screen (it has its own back button) */}

      <FlowHeader
        title={STEP_TITLES[flow.step]}
        subtitle={getStepSubtitle()}
        onBack={flow.goBack}
        rightSlot={
          flow.step === 'choice' ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="More options"
              className="size-10 border-0 rounded-full bg-[#0000000A]! text-foreground shrink-0"
            >
              <MoreVertical size={18} />
            </Button>
          ) : undefined
        }
      />

      {/* Animated step transitions */}
      <AnimatePresence mode="wait">
        {flow.step === 'choice' && (
          <motion.div key="choice" {...slideVariants} className="flex-1 flex flex-col overflow-hidden">
            <ChoiceStep flow={flow} />
          </motion.div>
        )}

        {flow.step === 'add_members' && (
          <motion.div key="add_members" {...slideVariants} className="flex-1 flex flex-col overflow-hidden">
            <AddMembersStep flow={flow} />
          </motion.div>
        )}

        {flow.step === 'group_details' && (
          <motion.div key="group_details" {...slideVariants} className="flex-1 flex flex-col overflow-hidden">
            <GroupDetailsStep flow={flow} />
          </motion.div>
        )}

        {flow.step === 'success' && (
          <motion.div key="success" {...slideVariants} className="flex-1 flex flex-col">
            <GroupSuccessStep flow={flow} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
