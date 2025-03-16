import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/mongodb"
import { Comment, Video } from "@/lib/models"
import { getServerSession } from "@/lib/auth"

interface Params {
  params: {
    id: string
  }
}

// Get comments for a video
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const page = Number.parseInt(searchParams.get("page") || "1")

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 })
    }

    await connectToDatabase()

    const comments = await Comment.find({ video: id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "username profilePicture")

    const total = await Comment.countDocuments({ video: id })

    return NextResponse.json({
      comments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

// Add a comment to a video
export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const { text } = await request.json()

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 })
    }

    await connectToDatabase()

    // Check if video exists
    const video = await Video.findById(id)

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Create comment
    const comment = new Comment({
      text,
      user: session.user.id,
      video: id,
      createdAt: new Date(),
    })

    await comment.save()

    // Populate user data
    await comment.populate("user", "username profilePicture")

    return NextResponse.json({
      success: true,
      comment,
    })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}

