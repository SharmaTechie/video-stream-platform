import { Suspense } from "react"
import { notFound } from "next/navigation"
import { VideoPlayer } from "@/components/video-player"
import { VideoInfo } from "@/components/video-info"
import { CommentSection } from "@/components/comment-section"
import { RelatedVideos } from "@/components/related-videos"
import { VideoSkeleton } from "@/components/video-skeleton"
import { getVideoById, getRelatedVideos } from "@/lib/data"

interface VideoPageProps {
  params: {
    id: string
  }
}

export default async function VideoPage({ params }: VideoPageProps) {
  const video = await getVideoById(params.id)

  if (!video) {
    notFound()
  }

  const relatedVideos = await getRelatedVideos(params.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VideoPlayer video={video as any} />
          <Suspense fallback={<div>Loading video information...</div>}>
            <VideoInfo video={video as any} />
          </Suspense>
          <Suspense fallback={<div>Loading comments...</div>}>
            <CommentSection videoId={params.id} />
          </Suspense>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Related Videos</h2>
          <Suspense
            fallback={
              <div className="space-y-4">
                {Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <VideoSkeleton key={i} horizontal />
                  ))}
              </div>
            }
          >
            <RelatedVideos videos={relatedVideos} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

