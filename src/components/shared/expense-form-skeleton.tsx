import { Skeleton } from '@/components/ui/skeleton'

/** Placeholder for the add/edit expense form while its data (the expense
 * being edited, categories, friendship lookup, ...) is still loading —
 * mirrors AddExpenseBase's own layout so nothing jumps once real content
 * replaces it. */
export default function ExpenseFormSkeleton() {
  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen px-6 pt-5 gap-6">
      <div className="flex items-center">
        <Skeleton className="size-10 rounded-full" />
      </div>
      <Skeleton className="h-18 rounded-[18px]" />
      <Skeleton className="h-14 rounded-[18px]" />
      <div className="flex gap-4">
        <Skeleton className="h-16 flex-1 rounded-[20px]" />
        <Skeleton className="h-16 flex-1 rounded-[20px]" />
      </div>
      <div className="flex flex-wrap gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>
    </div>
  )
}
