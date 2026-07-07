import { useSearch } from '@tanstack/react-router'
import { useContactStore } from '@/store/use-contact-store'
import { useNotifications } from '@/features/notifications/hooks/use-notifications'
import { type NotificationItem } from '../types'
import { useState } from 'react'
import { Check, Users, ChevronDown, Banknote, CreditCard, Smile, Shield, Upload, Calendar, Camera, Pencil, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'
import SuccessCheck from '@/components/shared/success-check'
import PaymentMethodDrawer, { type PaymentMethodType } from '@/components/shared/payment-method-drawer'
import SelectDateDrawer from '@/components/shared/select-date-drawer'
import AddReceiptFlow from '@/components/shared/add-receipt-flow'
import AddNoteFlow from '@/components/shared/add-note-flow'
import { useDrawerBackHandler } from '@/hooks/use-drawer-back-handler'
interface ReceiptFile {
  name: string
  size: string
  dataUrl?: string
}

export default function SettleUpPanel() {
  const { contactId, groupId, notificationId } = useSearch({ from: '/settle-up' })
  const { notifications, handleSettleComplete } = useNotifications()

  let contact = null
  let mode: 'contact' | 'group' = 'group'
  let notification: NotificationItem | null = null

  if (contactId) {
    const contacts = useContactStore((state) => state.contacts)
    contact = contacts.find((c) => c.id === contactId)
    mode = 'contact'
    if (contact) {
      const personalTag = contact.tags.find(
        (t) => t.name.toLowerCase().includes('1-to-1') || t.name.toLowerCase().includes('personal')
      )
      const personalAmount = personalTag ? personalTag.amount : contact.netAmount
      notification = {
        id: 'contact-settle',
        tag: 'Payment requested',
        title: `${contact.name} requested Rs. ${Math.abs(personalAmount)}`,
        subtitle: contact.name,
        time: 'Just now',
        type: 'request',
        section: 'action_needed',
        theme: 'green'
      }
    }
  } else if (groupId) {
    const contacts = useContactStore((state) => state.contacts)
    contact = contacts.find((c) => c.id === groupId)
    mode = 'group'
    if (contact) {
      notification = {
        id: 'group-settle',
        tag: 'Payment requested',
        title: `${contact.name} requested Rs. ${contact.netAmount}`,
        subtitle: contact.name,
        time: 'Just now',
        type: 'request',
        section: 'action_needed',
        theme: 'green'
      }
    }
  } else if (notificationId) {
    notification = notifications.find((n) => n.id === notificationId) || null
    if (notification) {
      mode = notification.subtitle.toLowerCase().includes('for:') || notification.subtitle.toLowerCase().includes('murree') ? 'group' : 'contact'
    }
  }

  const [activeTab, setActiveTab] = useState<'pay' | 'receive'>('pay')

  if (!notification) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">Payment request not found</p>
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

  // Parse dynamic requester data
  let requesterName = notification.title.split(' ')[0] || 'Muzaffar'
  if (
    requesterName.toLowerCase().includes('murree') ||
    requesterName.toLowerCase().includes('poker') ||
    requesterName.toLowerCase().includes('group') ||
    requesterName.toLowerCase().includes('trip')
  ) {
    requesterName = 'Muzaffar'
  }

  const groupName = notification.subtitle.toLowerCase().includes('for:')
    ? notification.subtitle.replace(/For:/i, '').trim()
    : 'Murree Trip'

  const amountMatch = notification.title.match(/Rs\.\s*([\d,]+)/)
  const totalDue = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : 2500

  // Split calculations
  const perPersonShare = Math.floor(totalDue / 2)

  // Max cap constants
  const muzaffarMax = totalDue === 2500 ? 1000 : perPersonShare
  const ahmedMax = totalDue === 2500 ? 1000 : perPersonShare
  const aliMax = 2000
  const saraMax = 800

  // Pay mode input states
  const [muzaffarAmount, setMuzaffarAmount] = useState('')
  const [ahmedAmount, setAhmedAmount] = useState('')

  // Receive mode input states
  const [aliAmount, setAliAmount] = useState('')
  const [saraAmount, setSaraAmount] = useState('')

  // 1-to-1 Mode state
  const [contactAmount, setContactAmount] = useState('')

  const handleAmountChange = (val: string, max: number, setter: (s: string) => void) => {
    const cleaned = val.replace(/[^0-9]/g, '')
    if (cleaned === '') {
      setter('')
      return
    }
    const num = Number(cleaned)
    if (num > max) {
      setter(max.toString())
    } else {
      setter(num.toString())
    }
  }

  const [showSuccess, setShowSuccess] = useState(false)

  // Attachment/Meta states & Drawers visibility
  const [method, setMethod] = useState<PaymentMethodType>('cash')
  const [dateVal, setDateVal] = useState<string>('today')
  const [receiptFile, setReceiptFile] = useState<ReceiptFile | null>(null)
  const [noteText, setNoteText] = useState('')

  const [isMethodDrawerOpen, setIsMethodDrawerOpen] = useState(false)
  const [isDateDrawerOpen, setIsDateDrawerOpen] = useState(false)
  const [isReceiptFlowOpen, setIsReceiptFlowOpen] = useState(false)
  const [isNoteFlowOpen, setIsNoteFlowOpen] = useState(false)

  // Back-button-aware close handlers — pressing the mobile hardware back
  // button while a drawer is open will close it instead of navigating away.
  const closeMethodDrawer = useDrawerBackHandler(isMethodDrawerOpen, () => setIsMethodDrawerOpen(false))
  const closeDateDrawer = useDrawerBackHandler(isDateDrawerOpen, () => setIsDateDrawerOpen(false))
  const closeReceiptFlow = useDrawerBackHandler(isReceiptFlowOpen, () => setIsReceiptFlowOpen(false))
  const closeNoteFlow = useDrawerBackHandler(isNoteFlowOpen, () => setIsNoteFlowOpen(false))

  // Calculate totals based on active mode
  const payingNow = mode === 'contact'
    ? (Number(contactAmount) || 0)
    : (Number(muzaffarAmount) || 0) + (Number(ahmedAmount) || 0)

  const receivingNow = mode === 'contact'
    ? (Number(contactAmount) || 0)
    : (Number(aliAmount) || 0) + (Number(saraAmount) || 0)

  const activeAmountNow = activeTab === 'pay' ? payingNow : receivingNow
  const stillLeft = Math.max(0, totalDue - activeAmountNow)

  const handleConfirmAction = () => {
    setShowSuccess(true)
  }

  const handleSuccessComplete = () => {
    if (notificationId) {
      handleSettleComplete(notificationId)
    }
    window.history.back()
  }

  // Fallback to "B" for Muzaffar to match the mockup exactly
  const requesterInitials = requesterName === 'Muzaffar' ? 'B' : requesterName.slice(0, 1).toUpperCase()

  const getMethodLabel = (m: PaymentMethodType) => {
    switch (m) {
      case 'cash': return 'Cash'
      case 'bank': return 'Bank Transfer'
      case 'easypaisa': return 'Easypaisa'
      case 'jazzcash': return 'JazzCash'
      case 'other': return 'Other'
      default: return 'Cash'
    }
  }

  const renderMethodIcon = (m: PaymentMethodType) => {
    switch (m) {
      case 'cash': return <Banknote size={14} className="text-[#6B6B6B]" />
      case 'bank': return <CreditCard size={14} className="text-[#6B6B6B]" />
      case 'easypaisa': return <Smile size={14} className="text-[#6B6B6B]" />
      case 'jazzcash': return <Shield size={14} className="text-[#6B6B6B]" />
      case 'other': return <Upload size={14} className="text-[#6B6B6B]" />
      default: return <Banknote size={14} className="text-[#6B6B6B]" />
    }
  }

  const formatPillDate = (d: string) => {
    if (d === 'today') return 'Today'
    if (d === 'yesterday') return 'Yesterday'
    return d
  }

  const hasReceipt = receiptFile !== null
  const hasNote = noteText.trim() !== ''

  if (showSuccess) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-[#FEFAF1] select-none justify-center">
        <SuccessCheck
          text={activeTab === 'receive' ? 'Payment Received' : 'Success'}
          showConfetti={activeTab === 'receive'}
          onComplete={handleSuccessComplete}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[#FEFAF1] select-none pb-32 text-[#1A1A1A]">
      {/* Header */}
      <FlowHeader
        title="Settle Up"
        onBack={() => window.history.back()}
        backVariant="circle"
        rightSlot={
          <Check
            size={24}
            onClick={handleConfirmAction}
            className="text-positive stroke-[3px] cursor-pointer hover:opacity-80 active:scale-95 transition-all shrink-0"
          />
        }
      />

      {/* Group Card */}
      {mode !== 'contact' && (
        <div className="px-6 mt-4">
          <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] p-4 flex items-center gap-3.5 shadow-[0px_4px_16px_rgba(0,0,0,0.02)] text-left">
            {/* Custom Mountain Group Avatar Icon */}
            <div className="w-12 h-12 rounded-full bg-[#E8F5EE] border border-positive/10 flex items-center justify-center overflow-hidden shrink-0">
              <svg viewBox="0 0 100 100" className="w-9 h-9">
                <circle cx="50" cy="50" r="45" fill="#E8F5EE" />
                <circle cx="65" cy="35" r="8" fill="#FDB105" opacity="0.8" />
                <path d="M25,70 L45,35 L60,55 L75,40 L90,70 Z" fill="#4CAF50" opacity="0.6" />
                <path d="M15,70 L35,45 L55,65 L70,50 L85,70 Z" fill="#0B683A" opacity="0.8" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[15px] text-[#1A1A1A] leading-tight">
                {groupName}
              </span>
              <span className="text-[12px] text-[#6B6B6B] font-semibold mt-0.5">
                6 members
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 mt-4">
        <div className="bg-white border-[0.8px] border-[#EBEBEB] rounded-full p-1.5 flex items-center">
          <button
            type="button"
            onClick={() => setActiveTab('pay')}
            className={`flex-1 py-3 text-center rounded-full text-sm font-extrabold transition-all border-0 outline-none cursor-pointer ${activeTab === 'pay'
              ? 'bg-[#C96A1B] text-white'
              : 'bg-transparent text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
          >
            Pay
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('receive')}
            className={`flex-1 py-3 text-center rounded-full text-sm font-extrabold transition-all border-0 outline-none cursor-pointer ${activeTab === 'receive'
              ? 'bg-positive text-white'
              : 'bg-transparent text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
          >
            Receive
          </button>
        </div>
      </div>

      {/* Paying/Receiving Now & Still Left Display Card (Single Container with Divider) */}
      <div className="px-6 mt-4">
        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] flex shadow-[0px_4px_16px_rgba(0,0,0,0.02)] overflow-hidden">
          {/* Active Mode Now */}
          <div className="flex-1 p-5 flex flex-col text-center items-center justify-center">
            <span className="text-[#6B6B6B] text-[12px] font-bold">
              {activeTab === 'pay' ? 'Paying now' : 'Receiving now'}
            </span>
            <span className={`text-[30px] font-extrabold mt-1.5 leading-none tracking-tight ${activeTab === 'pay' ? 'text-[#C96A1B]' : 'text-positive'
              }`}>
              Rs. {activeAmountNow.toLocaleString('en-US')}
            </span>
          </div>

          {/* Vertical Divider */}
          <div className="w-[0.8px] bg-[#EBEBEB] self-stretch my-4" />

          {/* Still Left */}
          <div className="flex-1 p-5 flex flex-col text-center items-center justify-center">
            <span className="text-[#6B6B6B] text-[12px] font-bold">
              Still left
            </span>
            <span className={`text-[30px] font-extrabold mt-1.5 leading-none tracking-tight ${activeTab === 'pay' ? 'text-[#C96A1B]' : 'text-positive'
              }`}>
              Rs. {stillLeft.toLocaleString('en-US')}
            </span>
          </div>
        </div>
      </div>

      {/* Member Selection Headers */}
      <div className="px-6 mt-6 flex items-center gap-2 text-[#C96A1B]">
        <Users size={16} strokeWidth={2.5} className="text-[#C96A1B]" />
        <span className="text-sm font-extrabold text-[#1A1A1A]">
          {activeTab === 'pay' ? 'Who did you pay?' : 'Who paid you?'}
        </span>
      </div>

      {/* Members Balance Inputs List (Directly on Canvas, Full-width divider) */}
      <div className="px-6 mt-4 flex flex-col gap-5 text-left">
        {mode === 'contact' ? (
          <MemberRow
            initials={requesterInitials}
            name={requesterName}
            subtext={
              activeTab === 'pay'
                ? `You owe Rs. ${Math.max(0, totalDue - (Number(contactAmount) || 0)).toLocaleString('en-US')}`
                : `Owes you Rs. ${Math.max(0, totalDue - (Number(contactAmount) || 0)).toLocaleString('en-US')}`
            }
            subtextColorClass={activeTab === 'pay' ? 'text-[#C96A1B]' : 'text-positive'}
            avatarBg="bg-[#EDE9FE]"
            avatarText="text-[#6366F1]"
            avatarBorder="border-[#6366F1]/10"
            amount={contactAmount}
            onAmountChange={(val) => handleAmountChange(val, totalDue, setContactAmount)}
            activeThemeColor={activeTab === 'pay' ? 'pay' : 'receive'}
          />
        ) : activeTab === 'pay' ? (
          <>
            {/* Muzaffar Member */}
            <MemberRow
              initials={requesterInitials}
              name={requesterName}
              subtext={`You owe Rs. ${Math.max(0, (totalDue === 2500 ? 1000 : perPersonShare) - (Number(muzaffarAmount) || 0)).toLocaleString('en-US')}`}
              avatarBg="bg-[#E1F0FF]"
              avatarText="text-[#1D70B8]"
              avatarBorder="border-[#1D70B8]/10"
              amount={muzaffarAmount}
              onAmountChange={(val) => handleAmountChange(val, muzaffarMax, setMuzaffarAmount)}
              activeThemeColor="pay"
            />

            {/* Divider */}
            <div className="h-[0.8px] bg-[#EBEBEB]/80 -mx-6" />

            {/* Ahmed Member */}
            <MemberRow
              initials="A"
              name="Ahmed"
              subtext={`Left: Rs. ${Math.max(0, (totalDue === 2500 ? 1000 : perPersonShare) - (Number(ahmedAmount) || 0)).toLocaleString('en-US')}`}
              subtextColorClass="text-[#C96A1B]"
              avatarBg="bg-[#FFF2D1]"
              avatarText="text-[#C96A1B]"
              avatarBorder="border-[#C96A1B]/10"
              amount={ahmedAmount}
              onAmountChange={(val) => handleAmountChange(val, ahmedMax, setAhmedAmount)}
              activeThemeColor="pay"
            />
          </>
        ) : (
          <>
            {/* Ali Member */}
            <MemberRow
              initials="A"
              name="Ali"
              subtext={`Owes you Rs. ${Math.max(0, 2000 - (Number(aliAmount) || 0)).toLocaleString('en-US')}`}
              avatarBg="bg-[#FFF2D1]"
              avatarText="text-[#C96A1B]"
              avatarBorder="border-[#C96A1B]/10"
              amount={aliAmount}
              onAmountChange={(val) => handleAmountChange(val, aliMax, setAliAmount)}
              activeThemeColor="receive"
            />

            {/* Divider */}
            <div className="h-[0.8px] bg-[#EBEBEB]/80 -mx-6" />

            {/* Sara Member */}
            <MemberRow
              initials="S"
              name="Sara"
              subtext={`Left: Rs. ${Math.max(0, 800 - (Number(saraAmount) || 0)).toLocaleString('en-US')}`}
              subtextColorClass="text-positive"
              avatarBg="bg-[#EDE9FE]"
              avatarText="text-[#6366F1]"
              avatarBorder="border-[#6366F1]/10"
              amount={saraAmount}
              onAmountChange={(val) => handleAmountChange(val, saraMax, setSaraAmount)}
              activeThemeColor="receive"
            />
          </>
        )}
      </div>

      {/* Bottom Option Pills Row */}
      <div className="px-6 mt-6 flex items-center justify-start gap-2.5 flex-wrap pb-2">
        {/* Method Picker Pill */}
        <button
          type="button"
          onClick={() => setIsMethodDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border-[0.8px] border-[#E8E4DC] bg-white text-xs font-medium text-[#6B6B6B] shrink-0 outline-none cursor-pointer active:scale-95 transition-all"
        >
          {renderMethodIcon(method)}
          <span>{getMethodLabel(method)}</span>
          <ChevronDown size={14} className="text-[#6B6B6B]" />
        </button>

        {/* Date Picker Pill */}
        <button
          type="button"
          onClick={() => setIsDateDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border-[0.8px] border-[#E8E4DC] bg-white text-xs font-medium text-[#6B6B6B] shrink-0 outline-none cursor-pointer active:scale-95 transition-all"
        >
          <Calendar size={14} className="text-[#6B6B6B]" />
          <span>{formatPillDate(dateVal)}</span>
          <ChevronDown size={14} className="text-[#6B6B6B]" />
        </button>

        {/* Receipt Pill */}
        <button
          type="button"
          onClick={() => setIsReceiptFlowOpen(true)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border-[0.8px] bg-white text-xs font-medium text-[#6B6B6B] shrink-0 outline-none cursor-pointer active:scale-95 transition-all ${hasReceipt
            ? 'bg-[#E4F2EB] border-[#0B683A4D] text-positive'
            : 'bg-white border-[#E8E4DC] text-[#6B6B6B]'
            }`}
        >
          <Camera size={14} className={hasReceipt ? 'text-positive' : 'text-[#6B6B6B]'} />
          <span>{hasReceipt ? 'Receipt Attached' : 'Receipt'}</span>
        </button>

        {/* Note Pill */}
        <button
          type="button"
          onClick={() => setIsNoteFlowOpen(true)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border-[0.8px] bg-white text-xs font-medium text-[#6B6B6B] shrink-0 outline-none cursor-pointer active:scale-95 transition-all ${hasNote
            ? 'bg-[#E4F2EB] border-[#0B683A4D] text-positive'
            : 'bg-white border-[#E8E4DC] text-[#6B6B6B]'
            }`}
        >
          <Pencil size={14} className={hasNote ? 'text-positive' : 'text-[#6B6B6B]'} />
          <span>{hasNote ? 'Note Added' : 'Note'}</span>
        </button>
      </div>


      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-3 left-3 right-3 z-10 flex flex-col items-center justify-center gap-4">
        {/* Confirmation Lock Warning Text */}
        <div className="mt-5 text-[#6B6B6B] text-xs font-normal flex items-center justify-center gap-1.5 shrink-0">
          <Lock size={12} className="text-[#6B6B6B]" />
          <span>They will be asked to confirm.</span>
        </div>
        <button
          type="button"
          onClick={handleConfirmAction}
          className="w-full h-14 rounded-full bg-[#FDB105] text-[#1A1A1A] font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
        >
          Confirm
        </button>
      </div>

      {/* Payment Method Drawer */}
      <PaymentMethodDrawer
        isOpen={isMethodDrawerOpen}
        onClose={closeMethodDrawer}
        selectedValue={method}
        onSelect={(val) => setMethod(val)}
      />

      {/* Select Date Drawer */}
      <SelectDateDrawer
        isOpen={isDateDrawerOpen}
        onClose={closeDateDrawer}
        selectedValue={dateVal}
        onSelect={(val) => setDateVal(val)}
      />

      {/* Add Receipt Flow Sheet */}
      <AddReceiptFlow
        isOpen={isReceiptFlowOpen}
        amount={activeAmountNow}
        description={groupName}
        category="other"
        initialFile={receiptFile}
        onClose={closeReceiptFlow}
        onSave={(file) => {
          setReceiptFile(file)
          closeReceiptFlow()
        }}
      />

      {/* Add Note Flow Sheet */}
      <AddNoteFlow
        isOpen={isNoteFlowOpen}
        amount={activeAmountNow}
        description={groupName}
        category="other"
        initialNote={noteText}
        onClose={closeNoteFlow}
        onSave={(text) => {
          setNoteText(text)
          closeNoteFlow()
        }}
      />
    </div>
  )
}

interface MemberRowProps {
  initials: string
  name: string
  subtext: string
  subtextColorClass?: string
  avatarBg: string
  avatarText: string
  avatarBorder: string
  amount: string
  onAmountChange: (val: string) => void
  activeThemeColor: 'pay' | 'receive'
}

function MemberRow({
  initials,
  name,
  subtext,
  subtextColorClass = 'text-[#6B6B6B]',
  avatarBg,
  avatarText,
  avatarBorder,
  amount,
  onAmountChange,
  activeThemeColor,
}: MemberRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3.5 min-w-0 text-left">
        <div className={cn(
          "size-11 rounded-full font-extrabold text-base flex items-center justify-center shrink-0 border",
          avatarBg,
          avatarText,
          avatarBorder
        )}>
          {initials}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-extrabold text-base text-[#1A1A1A] leading-tight truncate">
            {name}
          </span>
          <span className={cn("text-[12px] font-semibold mt-1 leading-none", subtextColorClass)}>
            {subtext}
          </span>
        </div>
      </div>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={amount}
        onChange={(e) => onAmountChange(e.target.value.replace(/\D/g, ''))}
        placeholder="Enter amount"
        className={cn(
          "border border-[#EBEBEB] rounded-[14px] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] font-bold text-center w-32 placeholder:text-[#9A9590] placeholder:font-medium focus:outline-none focus:ring-1",
          activeThemeColor === 'pay' ? 'focus:ring-[#C96A1B] focus:border-[#C96A1B]' : 'focus:ring-positive focus:border-positive'
        )}
      />
    </div>
  )
}
