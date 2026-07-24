import { Skeleton } from '@/components/ui/skeleton'

/** Placeholder for a shared ExpenseList while its data is still loading —
 * mirrors ExpenseItem's own row layout (icon, two lines, amount) so the
 * real list doesn't jump into a differently-sized container once it lands. */
export default function ExpenseListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-[24px] border-[0.8px] border-divider overflow-hidden divide-y divide-divider">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="w-12 h-12 rounded-[13px] shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}
