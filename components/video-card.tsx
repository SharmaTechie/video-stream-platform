import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface VideoCardProps {
  video: {
    _id: string
    title: string
    thumbnailId?: string
    views: number
    createdAt: string
    user: {
      _id: string
      username: string
      profilePicture?: string
    }
  }
  horizontal?: boolean
}

export function VideoCard({ video, horizontal = false }: VideoCardProps) {
  const thumbnailUrl = video.thumbnailId
    ? `/api/videos/${video._id}/thumbnail`
    : "/placeholder.svg?height=720&width=1280"

  const formattedDate = formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })
  const formattedViews = video.views >= 1000 ? `${(video.views / 1000).toFixed(1)}K` : video.views.toString()

  if (horizontal) {
    return (
      <Link href={`/video/${video._id}`} className="flex gap-4 group">
        <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-md">
          <Image
            src={thumbnailUrl || "/placeholder.svg"}
            alt={video.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col">
          <h3 className="font-medium line-clamp-2 group-hover:text-primary">{video.title}</h3>
          <div className="mt-1 flex items-center text-sm text-muted-foreground">
            <Link href={`/profile/${video.user.username}`} className="hover:text-foreground">
              {video.user.username}
            </Link>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formattedViews} views • {formattedDate}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="group">
      <Link href={`/video/${video._id}`} className="block">
        <div className="relative aspect-video w-full overflow-hidden rounded-md">
          <Image
            src={thumbnailUrl || "/placeholder.svg"}
            alt={video.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <div className="mt-2">
          <div className="flex gap-2">
            <Avatar className="h-8 w-8 mt-1">
              <AvatarImage src={video.user.profilePicture || "/placeholder-user.jpg"} alt={video.user.username} />
              <AvatarFallback>{video.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium line-clamp-2 group-hover:text-primary">{video.title}</h3>
              <div className="mt-1 flex items-center text-sm text-muted-foreground">
                <Link href={`/profile/${video.user.username}`} className="hover:text-foreground">
                  {video.user.username}
                </Link>
              </div>
              <div className="text-xs text-muted-foreground">
                {formattedViews} views • {formattedDate}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

