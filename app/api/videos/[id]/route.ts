import { NextResponse } from "next/server"
import { GridFSBucket, ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/mongodb"
import { Video, Comment } from "@/lib/models"
import { getServerSession } from "@/lib/auth"

interface Params {
  params: {
    id: string
  }
}

// Get video by ID
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 })
    }

    await connectToDatabase()

    const video = await Video.findById(id).populate("user", "username profilePicture")

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Increment view count
    video.views += 1
    await video.save()

    return NextResponse.json({ video })
  } catch (error) {
    console.error("Error fetching video:", error)
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 })
  }
}

// Update video
export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const { title, description, visibility } = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 })
    }

    await connectToDatabase()

    const video = await Video.findById(id)

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Check if user owns the video
    if (video.user.toString() !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to update this video" }, { status: 403 })
    }

    // Update fields
    if (title) video.title = title
    if (description !== undefined) video.description = description
    if (visibility) video.visibility = visibility

    await video.save()

    return NextResponse.json({ success: true, video })
  } catch (error) {
    console.error("Error updating video:", error)
    return NextResponse.json({ error: "Failed to update video" }, { status: 500 })
  }
}

// Delete video
export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const bucket = new GridFSBucket(db)

    const video = await Video.findById(id)

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Check if user owns the video
    if (video.user.toString() !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete this video" }, { status: 403 })
    }

    // Delete video file from GridFS
    await bucket.delete(new ObjectId(video.fileId))

    // Delete thumbnail if exists
    if (video.thumbnailId) {
      await bucket.delete(new ObjectId(video.thumbnailId))
    }

    // Delete resolution files
    if (video.resolutions) {
      for (const resolution of Object.values(video.resolutions)) {
        if (resolution) {
          await bucket.delete(new ObjectId(resolution))
        }
      }
    }

    // Delete comments
    await Comment.deleteMany({ video: id })

    // Delete video document
    await Video.findByIdAndDelete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting video:", error)
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 })
  }
}

