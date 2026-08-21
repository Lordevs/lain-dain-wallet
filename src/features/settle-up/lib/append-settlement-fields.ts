import type { PaymentMethodType } from '@/components/shared/payment-method-drawer'
import type { components } from '@/lib/api/schema'

type ApiMethod = components['schemas']['MethodEnum']

/** The drawer's 'bank' maps to the backend's 'bank_transfer' — every other
 * value is spelled the same on both sides. */
export function toApiMethod(method: PaymentMethodType): ApiMethod {
  return method === 'bank' ? 'bank_transfer' : method
}

export interface SettlementCoreValues {
  mode: 'pay' | 'receive'
  method: PaymentMethodType
  date?: string
  note?: string
  /** Local data:/blob: URL from the receipt picker — not yet a real file */
  receipt?: string | null
}

export function settlementFields(data: SettlementCoreValues): Array<[string, string]> {
  const fields: Array<[string, string]> = [
    ['mode', data.mode],
    ['method', toApiMethod(data.method)],
  ]
  if (data.date) fields.push(['date', data.date])
  if (data.note) fields.push(['note', data.note])
  return fields
}

/** Appends the fields shared by both friendship and group settlement
 * creation — only `amount` (friendship) vs `entries` (group) differ,
 * appended separately by each caller before this runs. */
export async function appendSettlementFields(formData: FormData, data: SettlementCoreValues): Promise<void> {
  for (const [key, value] of settlementFields(data)) formData.append(key, value)

  if (data.receipt) {
    const blob = await fetch(data.receipt).then((res) => res.blob())
    formData.append('receipt', blob, 'receipt.jpg')
  }
}
