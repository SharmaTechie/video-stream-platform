import { notFound } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VideoGrid } from "@/components/video-grid"
import { getUserByUsername, getUserVideos } from "@/lib/data"

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const user = await getUserByUsername(params.username)

  if (!user) {
    notFound()
  }

  const videos = await getUserVideos(user._id)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start gap-8 mb-8">
        <Avatar className="w-24 h-24 md:w-32 md:h-32">
          <AvatarImage src={user.profilePicture || "/placeholder-user.jpg"} alt={user.username} />
          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div>
          <h1 className="text-3xl font-bold">{user.username}</h1>
          <p className="text-muted-foreground mt-1">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
          <div className="flex gap-4 mt-4">
            <div>
              <p className="text-2xl font-bold">{videos.length}</p>
              <p className="text-sm text-muted-foreground">Videos</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{user.subscribers || 0}</p>
              <p className="text-sm text-muted-foreground">Subscribers</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="videos">
        <TabsList>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        <TabsContent value="videos" className="mt-6">
          {videos.length > 0 ? (
            <VideoGrid videos={videos} />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No videos uploaded yet</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="about" className="mt-6">
          <div className="bg-card rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">About {user.username}</h2>
            <p className="text-muted-foreground">{user.bio || `${user.username} hasn't added a bio yet.`}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

