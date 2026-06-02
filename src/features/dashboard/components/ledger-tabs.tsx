import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export type LedgerTab = 'receivables' | 'payables'

interface LedgerTabsProps {
  activeTab: LedgerTab
  onTabChange: (tab: LedgerTab) => void
}

/**
 * LedgerTabs — the Receivables / Payables pill tab switcher.
 * Uses shadcn Tabs component with custom pill styling.
 */
export default function LedgerTabs({ activeTab, onTabChange }: LedgerTabsProps) {
  return (
    <div className="mx-6 mt-4">
      <Tabs
        value={activeTab}
        onValueChange={(val) => onTabChange(val as LedgerTab)}
        className="w-full"
      >
        <TabsList className="flex w-full bg-[#FFFFFF] border-[0.8px] border-[#E8E4DC] p-1 rounded-full shadow-[0px_1px_4px_0px_#0000000F] h-13! items-center">
          <TabsTrigger
            value="receivables"
            id="tab-receivables"
            className={cn(
              "flex-1 h-11! rounded-full text-sm font-bold transition-all duration-200 cursor-pointer border-0",
              "text-[#9A9590] hover:text-foreground",
              "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0px_3px_12px_0px_#0B683A4D]"
            )}
          >
            Receivables
          </TabsTrigger>
          <TabsTrigger
            value="payables"
            id="tab-payables"
            className={cn(
              "flex-1 h-11! rounded-full text-sm font-bold transition-all duration-200 cursor-pointer border-0",
              "text-[#9A9590] hover:text-foreground",
              "data-[state=active]:bg-[#C3550A] data-[state=active]:text-white data-[state=active]:shadow-[0px_3px_12px_0px_#B453094D]"
            )}
          >
            Payables
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
