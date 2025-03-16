import { VideoCard } from "@/components/video-card"

interface RelatedVideosProps {
  videos: any[]
}

export function RelatedVideos({ videos }: RelatedVideosProps) {
  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <VideoCard key={video._id} video={video} horizontal />
      ))}

      {videos.length === 0 && <div className="text-center py-8 text-muted-foreground">No related videos found</div>}
    </div>
  )
}

