import { connectToDatabase } from "@/lib/mongodb"
import { Video, User } from "@/lib/models"
import { cache } from "react"

export const getVideos = cache(async (limit = 20) => {
  try {
    await connectToDatabase()

    const videos = await Video.find({ visibility: "public" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("user", "username profilePicture")

    return videos
  } catch (error) {
    console.error("Error fetching videos:", error)
    return []
  }
})

export const getVideoById = cache(async (id: string) => {
  try {
    await connectToDatabase()

    const video = await Video.findById(id).populate("user", "username profilePicture subscribers")

    return video
  } catch (error) {
    console.error("Error fetching video:", error)
    return null
  }
})

export const getRelatedVideos = cache(async (videoId: string, limit = 10) => {
  try {
    await connectToDatabase()

    const video = await Video.findById(videoId)

    if (!video) {
      return []
    }

    // Find videos by the same user or with similar title/description
    const relatedVideos = await Video.find({
      _id: { $ne: videoId },
      visibility: "public",
      $or: [
        { user: video.user },
        {
          $or: [
            { title: { $regex: video.title.split(" ")[0], $options: "i" } },
            { description: { $regex: video.title.split(" ")[0], $options: "i" } },
          ],
        },
      ],
    })
      .sort({ views: -1 })
      .limit(limit)
      .populate("user", "username profilePicture")

    return relatedVideos
  } catch (error) {
    console.error("Error fetching related videos:", error)
    return []
  }
})

export const getUserByUsername = cache(async (username: string) => {
  try {
    await connectToDatabase()

    const user = await User.findOne({ username })

    return user
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
})

export const getUserVideos = cache(async (userId: string) => {
  try {
    await connectToDatabase()

    const videos = await Video.find({
      user: userId,
      visibility: "public",
    })
      .sort({ createdAt: -1 })
      .populate("user", "username profilePicture")

    return videos
  } catch (error) {
    console.error("Error fetching user videos:", error)
    return []
  }
})

