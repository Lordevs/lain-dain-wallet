import { createFileRoute } from '@tanstack/react-router'
import ReportIssuePanel from '@/features/settings/components/report-issue-panel'

export const Route = createFileRoute('/settings/report-issue')({
  component: ReportIssuePanel,
})
