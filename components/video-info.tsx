"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Share2, Flag, MoreVertical, ThumbsUp, ThumbsDown, Edit, Trash2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { likeVideo, deleteVideo } from "@/lib/video-actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface VideoInfoProps {
  video: {
    _id: string
    title: string
    description?: string
    views: number
    likes: number
    createdAt: string
    user: {
      _id: string
      username: string
      profilePicture?: string
      subscribers?: number
    }
  }
}

export function VideoInfo({ video }: VideoInfoProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(video.likes)
  const [showFullDescription, setShowFullDescription] = useState(false)

  const isOwner = user && user.id === video.user._id
  const formattedDate = formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like videos",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await likeVideo(video._id)
      if (result.success) {
        setIsLiked(!isLiked)
        setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like video",
        variant: "destructive",
      })
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: "Link copied",
      description: "Video link copied to clipboard",
    })
  }

  const handleDelete = async () => {
    if (!isOwner) return

    const confirmed = window.confirm("Are you sure you want to delete this video? This action cannot be undone.")

    if (confirmed) {
      try {
        const result = await deleteVideo(video._id)
        if (result.success) {
          toast({
            title: "Video deleted",
            description: "Your video has been deleted successfully",
          })
          router.push("/")
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to delete video",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete video",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="mt-4">
      <h1 className="text-2xl font-bold">{video.title}</h1>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-4">
        <div className="flex items-center">
          <Link href={`/profile/${video.user.username}`}>
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={video.user.profilePicture || "/placeholder-user.jpg"} alt={video.user.username} />
              <AvatarFallback>{video.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>

          <div>
            <Link href={`/profile/${video.user.username}`} className="font-medium hover:underline">
              {video.user.username}
            </Link>
            <p className="text-sm text-muted-foreground">{video.user.subscribers || 0} subscribers</p>
          </div>

          {!isOwner && (
            <Button variant="secondary" size="sm" className="ml-4">
              Subscribe
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-secondary rounded-full">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-l-full ${isLiked ? "text-primary" : ""}`}
              onClick={handleLike}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              {likeCount}
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" className="rounded-r-full">
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="secondary" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/video/${video._id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit video
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete video
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem>
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-4 p-4 bg-card rounded-lg">
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <span>{video.views} views</span>
          <span className="mx-2">•</span>
          <span>{formattedDate}</span>
        </div>

        {video.description && (
          <div className="mt-2 text-sm whitespace-pre-line">
            <p className={!showFullDescription ? "line-clamp-3" : ""}>{video.description}</p>
            {video.description.length > 150 && (
              <button
                className="text-primary text-sm mt-1 font-medium"
                onClick={() => setShowFullDescription(!showFullDescription)}
              >
                {showFullDescription ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

