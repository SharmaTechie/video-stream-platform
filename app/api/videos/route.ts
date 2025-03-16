import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Video } from "@/lib/models"

// Get all videos (public)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const search = searchParams.get("search") || ""

    await connectToDatabase()

    const query = {
      visibility: "public",
      ...(search
        ? {
            $or: [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }],
          }
        : {}),
    }

    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "username profilePicture")

    const total = await Video.countDocuments(query)

    return NextResponse.json({
      videos,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching videos:", error)
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 })
  }
}

