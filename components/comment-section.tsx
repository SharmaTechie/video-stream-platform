"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { addComment, getComments } from "@/lib/comment-actions"
import { useRouter } from "next/navigation"

interface Comment {
  _id: string
  text: string
  user: {
    _id: string
    username: string
    profilePicture?: string
  }
  createdAt: string
}

interface CommentSectionProps {
  videoId: string
}

export function CommentSection({ videoId }: CommentSectionProps) {
  const { user, status } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(true)

  // Load comments
  useState(() => {
    const loadComments = async () => {
      try {
        const result = await getComments(videoId)
        setComments(result.comments)
      } catch (error) {
        console.error("Failed to load comments:", error)
      } finally {
        setIsLoadingComments(false)
      }
    }

    loadComments()
  })

  const handleAddComment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to comment",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!commentText.trim()) return

    setIsLoading(true)

    try {
      const result = await addComment(videoId, commentText)

      if (result.success) {
        setComments([result.comment, ...comments])
        setCommentText("")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add comment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">{comments.length} Comments</h2>

      <div className="flex gap-4 mb-6">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user?.profilePicture || "/placeholder-user.jpg"} alt={user?.username || "User"} />
          <AvatarFallback>{user?.username ? user.username.slice(0, 2).toUpperCase() : "U"}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <Textarea
            placeholder={status === "authenticated" ? "Add a comment..." : "Sign in to comment"}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={status !== "authenticated"}
            className="resize-none mb-2"
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommentText("")}
              disabled={!commentText.trim() || status !== "authenticated"}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={!commentText.trim() || isLoading || status !== "authenticated"}
            >
              {isLoading ? "Commenting..." : "Comment"}
            </Button>
          </div>
        </div>
      </div>

      {isLoadingComments ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment._id} className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.user.profilePicture || "/placeholder-user.jpg"} alt={comment.user.username} />
                <AvatarFallback>{comment.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{comment.user.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">No comments yet. Be the first to comment!</div>
      )}
    </div>
  )
}

