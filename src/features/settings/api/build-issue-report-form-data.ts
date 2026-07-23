interface IssueReportFormValues {
  category: string
  description: string
  screenshot: string | null
  contactEmail: string
}

/**
 * Converts the report-issue form's UI-shaped data into a multipart
 * FormData body for POST /api/support/issues/ — the screenshot (a local
 * data: or blob: URL, not yet a real file) is fetched into a Blob so it
 * can be attached as a real upload, same pattern as
 * build-profile-form-data.ts.
 */
export async function buildIssueReportFormData(data: IssueReportFormValues): Promise<FormData> {
  const formData = new FormData()

  formData.append('category', data.category)
  formData.append('description', data.description)
  if (data.contactEmail) formData.append('contact_email', data.contactEmail)

  if (data.screenshot) {
    const blob = await fetch(data.screenshot).then((res) => res.blob())
    formData.append('screenshot', blob, 'screenshot.jpg')
  }

  return formData
}
