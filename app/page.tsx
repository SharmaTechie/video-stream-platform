import { Suspense } from "react"
import Link from "next/link"
import { VideoCard } from "@/components/video-card"
import { Button } from "@/components/ui/button"
import { Search } from "@/components/search"
import { VideoSkeleton } from "@/components/video-skeleton"
import { getVideos } from "@/lib/data"

export default async function Home() {
  const videos = await getVideos()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Discover videos</h1>
        <div className="flex items-center gap-4">
          <Search />
          <Button asChild>
            <Link href="/upload">Upload Video</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Suspense fallback={<VideoSkeletonGrid />}>
          {videos.map((video) => (
            <VideoCard key={video._id as string} video={video as any} />
          ))}
        </Suspense>
      </div>
    </div>
  )
}

function VideoSkeletonGrid() {
  return (
    <>
      {Array(8)
        .fill(0)
        .map((_, i) => (
          <VideoSkeleton key={i} />
        ))}
    </>
  )
}

