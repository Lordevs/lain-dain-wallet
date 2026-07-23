import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { pickFromGallery } from '@/lib/camera'
import { haptic } from '@/lib/haptics'
import {
  Wallet,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  HelpCircle,
  Mail,
  Camera,
  Check,
  Send,
  AlertCircle,
  X
} from 'lucide-react'
import FlowHeader from '@/components/shared/flow-header'
import FormError from '@/components/shared/form-error'
import { useAuthStore } from '@/store/use-auth-store'
import { useReportIssueMutation } from '@/features/settings/api/use-report-issue-mutation'
import { buildIssueReportFormData } from '@/features/settings/api/build-issue-report-form-data'

interface ReportIssuePanelProps {
  onClose?: () => void
  onSuccess?: (msg: string) => void
}

type IssueType = 'payment' | 'split' | 'agreement' | 'bug' | 'other'

// Mirrors apps/support/validators.py's validate_screenshot so a bad file is
// caught at selection time instead of only after a round-trip 400.
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024
const ALLOWED_SCREENSHOT_TYPES = ['image/jpeg', 'image/png']

export default function ReportIssuePanel({
  onClose = () => window.history.back(),
  onSuccess,
}: ReportIssuePanelProps) {
  const { userProfile } = useAuthStore()
  const reportIssue = useReportIssueMutation()

  // Form states
  const [selectedIssue, setSelectedIssue] = useState<IssueType>('payment')
  const [description, setDescription] = useState('')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [screenshotError, setScreenshotError] = useState<string | null>(null)
  const [email, setEmail] = useState(userProfile?.email || '')

  const maxChars = 300

  // Both the native webPath and the web dataURL are local URLs, not yet a
  // known File — fetch each into a Blob so type/size can be checked the
  // same way regardless of platform.
  const validateAndSetScreenshot = async (localUrl: string) => {
    setScreenshotError(null)
    const blob = await fetch(localUrl).then((res) => res.blob())
    if (!ALLOWED_SCREENSHOT_TYPES.includes(blob.type)) {
      setScreenshotError('Screenshot must be a JPG or PNG image.')
      return
    }
    if (blob.size > MAX_SCREENSHOT_BYTES) {
      setScreenshotError('Screenshot must be 5MB or smaller.')
      return
    }
    setScreenshot(localUrl)
  }

  const handleScreenshotPick = async () => {
    haptic.light()
    if (Capacitor.isNativePlatform()) {
      const photo = await pickFromGallery()
      if (photo?.webPath) await validateAndSetScreenshot(photo.webPath)
    } else {
      // Web dev fallback: file picker
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onloadend = () => validateAndSetScreenshot(reader.result as string)
        reader.readAsDataURL(file)
      }
      input.click()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return

    // category is a free string on the backend (see IssueReport's model
    // docstring) — the selected issue's display title doubles as it, so
    // the category taxonomy can change here without a backend deploy.
    const category = issuesList.find((item) => item.id === selectedIssue)?.title ?? selectedIssue
    const formData = await buildIssueReportFormData({
      category,
      description: description.trim(),
      screenshot,
      contactEmail: email.trim(),
    })

    reportIssue.mutate(formData, {
      onSuccess: () => {
        onSuccess?.('Thank you! Issue report submitted successfully.')
        onClose()
      },
    })
  }

  const issuesList = [
    {
      id: 'payment' as IssueType,
      title: 'Payment not received',
      subtitle: 'I marked as paid but didn\'t receive',
      icon: Wallet,
      bgColor: 'bg-[#FFF3E6]',
      iconColor: 'text-[#01592B]',
    },
    {
      id: 'split' as IssueType,
      title: 'Wrong amount or split',
      subtitle: 'The numbers don\'t look right',
      icon: DollarSign,
      bgColor: 'bg-[#E4F2EB]',
      iconColor: 'text-positive',
    },
    {
      id: 'agreement' as IssueType,
      title: 'Expense I didn\'t agree to',
      subtitle: 'Someone added me without consent',
      icon: AlertTriangle,
      bgColor: 'bg-[#FFF0EE]',
      iconColor: 'text-[#000000]',
    },
    {
      id: 'bug' as IssueType,
      title: 'App bug or technical issue',
      subtitle: 'Something isn\'t working correctly',
      icon: ShieldCheck,
      bgColor: 'bg-[#F0F4FF]',
      iconColor: 'text-[#4F46E5]',
    },
    {
      id: 'other' as IssueType,
      title: 'Something else',
      subtitle: 'Describe your issue below',
      icon: HelpCircle,
      bgColor: 'bg-[#F5F5F5]',
      iconColor: 'text-[#6B6B6B]',
    },
  ]

  return (
    <div className="min-h-screen bg-[#FEFAF1] flex flex-col select-none overflow-y-auto text-[#1A1A1A]">
      <FlowHeader
        title="Report an Issue"
        onBack={onClose}
      />

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between px-6 pb-8 pt-2">
        <div className="space-y-6">

          {/* What's the Issue Selection */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase mb px-1">
              What's the issue?
            </h3>
            <div className="bg-white border-[1.5px] border-[#EBEBEB] rounded-[18px] shadow-[0px_2px_10px_0px_#0000000D] overflow-hidden divide-y-[1.5px] divide-[#EBEBEB]">
              {issuesList.map((item) => {
                const isSelected = selectedIssue === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIssue(item.id)}
                    className={`w-full flex items-center justify-between p-4 text-left transition-colors cursor-pointer outline-none ${isSelected ? 'bg-[#E4F2EB]/10' : ''
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-[13px] ${item.bgColor} ${item.iconColor} flex items-center justify-center shrink-0`}>
                        <item.icon size={20} strokeWidth={2.2} />
                      </div>
                      <div>
                        <h4 className={`text-[15px] font-bold leading-tight ${isSelected ? 'text-positive' : 'text-[#1A1A1A]'}`}>
                          {item.title}
                        </h4>
                        <p className="text-[12px] text-[#6B6B6B] mt-1">{item.subtitle}</p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-positive text-white flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-[1.5px] border-[#EBEBEB] bg-white" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Describe the Issue Box */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase mb-1.5 px-1">
              Describe the issue
            </h3>
            <div className="bg-white border-[1.5px] border-[#EBEBEB] focus-within:border-positive rounded-[18px] overflow-hidden flex flex-col shadow-[0px_2px_10px_0px_rgba(0,0,0,0.03)] transition-all">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, maxChars))}
                className="w-full h-28 p-4 outline-none border-0 resize-none text-[14px] font-medium text-[#1A1A1A] bg-transparent leading-relaxed"
                placeholder="Describe your issue..."
                required
              />
              <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-[#F5EFE6] bg-[#FEFAF1]/30">
                <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
                  {maxChars - description.length} characters remaining
                </span>
                <button
                  type="button"
                  onClick={() => setDescription('')}
                  className="text-positive font-bold text-[13px] cursor-pointer outline-none bg-transparent border-0"
                >
                  Clear
                </button>
              </div>
            </div>
            <p className="text-[12px] text-[#6B6B6B] mt-2 leading-tight px-1 text-left">
              Be as specific as possible — transaction ID, date, amount, and who's involved.
            </p>
          </div>

          {/* Attach Screenshot */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase mb-1.5 px-1">
              Attach Screenshot (Optional)
            </h3>
            {screenshot ? (
              <div className="relative w-full h-48 rounded-[18px] overflow-hidden border border-[#E8E4DC] shadow-[0px_2px_10px_rgba(0,0,0,0.03)] bg-white group">
                <img
                  src={screenshot}
                  alt="Screenshot preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    haptic.heavy()
                    setScreenshot(null)
                    setScreenshotError(null)
                  }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/55 hover:bg-black/70 text-white flex items-center justify-center cursor-pointer transition-all border-0 outline-none shadow-md"
                  aria-label="Remove screenshot"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleScreenshotPick}
                className="w-full flex items-center gap-4 bg-white border-[1.5px] border-dashed border-[#E8E4DC] rounded-[18px] p-4 cursor-pointer transition-colors shadow-[0px_2px_10px_rgba(0,0,0,0.01)] text-left outline-none"
              >
                <div className="w-11 h-11 rounded-[13px] bg-[#E4F2EB] flex items-center justify-center text-primary shrink-0">
                  <Camera size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <span className="text-[15px] font-semibold text-[#1A1A1A] block leading-tight">
                    Upload screenshot
                  </span>
                  <span className="text-[12px] text-[#6B6B6B] mt-1 block">
                    Helps us resolve faster · JPG, PNG up to 5MB
                  </span>
                </div>
              </button>
            )}
            <FormError message={screenshotError} className="mt-2" />
          </div>

          {/* Your Email */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase mb-1.5 px-1">
              Your Email (Optional)
            </h3>
            <div className="flex items-center gap-3 bg-white border-[0.8px] border-[#E8E4DC] focus-within:border-[#0B683A73] rounded-[16px] px-5 py-4 transition-all shadow-[0px_2px_10px_rgba(0,0,0,0.03)] text-left">
              <Mail size={18} className="text-[#6B6B6B] shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="outline-none border-0 w-full text-[15px] font-semibold text-[#1A1A1A] p-0 bg-transparent placeholder:text-[#C0BAB2] placeholder:font-normal"
                placeholder="We'll reply here if needed"
              />
            </div>
          </div>

          {/* Respond Notice Banner */}
          <div className="bg-[#FEF8EC] border-[1.5px] border-[#C85A0026] rounded-[18px] p-4 flex gap-3 text-left">
            <AlertCircle size={20} className="text-[#C96A1B] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#6B6B6B] font-normal leading-relaxed">
              Our team typically responds within 24–48 hours. For urgent payment disputes, include the transaction ID and date so we can investigate immediately.
            </p>
          </div>

        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <FormError message={reportIssue.error?.message} className="mb-4 justify-center" />
          <button
            type="submit"
            disabled={reportIssue.isPending}
            className="w-full h-14 bg-primary text-white rounded-full font-bold text-[17px] shadow-[0px_4px_16px_0px_#0B683A4D] active:scale-[0.98] disabled:opacity-70 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {reportIssue.isPending ? (
              'Submitting...'
            ) : (
              <>
                <Send size={16} className="shrink-0" />
                Submit Report
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
