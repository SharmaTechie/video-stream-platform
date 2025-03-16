import { Skeleton } from "@/components/ui/skeleton"

interface VideoSkeletonProps {
  horizontal?: boolean
}

export function VideoSkeleton({ horizontal = false }: VideoSkeletonProps) {
  if (horizontal) {
    return (
      <div className="flex gap-4">
        <Skeleton className="aspect-video w-40 h-24 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Skeleton className="aspect-video w-full rounded-md" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  )
}

