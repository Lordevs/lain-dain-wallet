import { useEffect, useRef } from 'react'

interface WizardController {
  step: string
  baseStep: string
  goBack: () => void
}

/**
 * Syncs multi-step wizard state with the browser history stack.
 * Allows physical/mobile back buttons to navigate backward through steps
 * instead of leaving the screen entirely.
 *
 * @param controller.step     - The current active step name.
 * @param controller.baseStep - The starting/root step name.
 * @param controller.goBack   - Function to call to step backward.
 */
export function useWizardBackHandler({ step, baseStep, goBack }: WizardController) {
  const goBackRef = useRef(goBack)
  useEffect(() => {
    goBackRef.current = goBack
  }, [goBack])

  const stepRef = useRef(step)
  const prevStepRef = useRef(step)
  const isPoppingRef = useRef(false)

  // Track current step in a mutable ref
  useEffect(() => {
    stepRef.current = step
  }, [step])

  // Synchronize history stack size on step change
  useEffect(() => {
    const currentStep = step
    const prevStep = prevStepRef.current
    prevStepRef.current = currentStep

    if (isPoppingRef.current) {
      isPoppingRef.current = false
      return
    }

    // If advancing from base step, push state
    if (currentStep !== baseStep && prevStep === baseStep) {
      window.history.pushState({ __wizardStep: currentStep }, '')
    }
    // If returning back to base step from elsewhere, clear the sentinel if present
    else if (currentStep === baseStep && prevStep !== baseStep) {
      // No-op: the sentinel is already gone or handled on back
    }
    // If moving between sub-steps (e.g. step A -> step B, neither is baseStep)
    else if (currentStep !== baseStep && prevStep !== baseStep) {
      window.history.replaceState({ __wizardStep: currentStep }, '')
    }
  }, [step, baseStep])

  // Intercept browser back navigation
  useEffect(() => {
    const handlePopState = () => {
      // If we are not on the base step, popstate means user clicked back button
      if (stepRef.current !== baseStep) {
        isPoppingRef.current = true
        goBackRef.current()
      }
    };

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [baseStep])

  // Wrapper for manual back button clicks in headers
  const handleManualBack = () => {
    if (stepRef.current !== baseStep) {
      // Go back in history (which triggers popstate, handled above)
      window.history.back()
    } else {
      goBackRef.current()
    }
  }

  return handleManualBack
}
