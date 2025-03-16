import { NextResponse } from "next/server"
import { GridFSBucket, ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/mongodb"
import { Video } from "@/lib/models"
import { getServerSession } from "@/lib/auth"
import { processVideo } from "@/lib/video-processing"

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const visibility = formData.get("visibility") as string
    const videoFile = formData.get("video") as File
    const thumbnailFile = formData.get("thumbnail") as File | null

    if (!title || !videoFile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()
    const bucket = new GridFSBucket(db)

    // Generate video ID
    const videoId = new ObjectId()

    // Upload video to GridFS
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer())
    const videoUploadStream = bucket.openUploadStream(videoFile.name, {
      metadata: {
        contentType: videoFile.type,
        videoId: videoId.toString(),
        userId: session.user.id,
      },
    })

    await new Promise<void>((resolve, reject) => {
      videoUploadStream.on("finish", resolve)
      videoUploadStream.on("error", reject)
      videoUploadStream.end(videoBuffer)
    })

    // Process video (create different resolutions)
    const videoFileId = videoUploadStream.id
    const resolutions = await processVideo(db, videoFileId)

    // Handle thumbnail
    let thumbnailFileId = null
    if (thumbnailFile) {
      const thumbnailBuffer = Buffer.from(await thumbnailFile.arrayBuffer())
      const thumbnailUploadStream = bucket.openUploadStream(thumbnailFile.name, {
        metadata: {
          contentType: thumbnailFile.type,
          videoId: videoId.toString(),
          userId: session.user.id,
          isThumbnail: true,
        },
      })

      await new Promise<void>((resolve, reject) => {
        thumbnailUploadStream.on("finish", resolve)
        thumbnailUploadStream.on("error", reject)
        thumbnailUploadStream.end(thumbnailBuffer)
      })

      thumbnailFileId = thumbnailUploadStream.id
    }

    // Create video document
    const video = new Video({
      _id: videoId,
      title,
      description,
      user: session.user.id,
      fileId: videoFileId,
      thumbnailId: thumbnailFileId,
      visibility,
      duration: 0, // Will be updated after processing
      resolutions,
      views: 0,
      likes: 0,
      createdAt: new Date(),
    })

    await video.save()

    return NextResponse.json({
      success: true,
      videoId: video._id,
    })
  } catch (error) {
    console.error("Video upload error:", error)
    return NextResponse.json({ error: "Failed to upload video" }, { status: 500 })
  }
}

