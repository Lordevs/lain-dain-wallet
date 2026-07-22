import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormErrorProps {
  message: string | null | undefined
  className?: string
}

/** Inline form-submission error — icon + message, nothing rendered when
 * there's no message. Alignment/spacing varies by call site (some sit
 * under a left-aligned field, others above a centered button), so that's
 * left to `className` rather than baked in here. */
export default function FormError({ message, className }: FormErrorProps) {
  if (!message) return null

  return (
    <div className={cn('flex items-start gap-2 text-tertiary', className)}>
      <AlertCircle size={16} className="shrink-0 mt-0.5" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}
