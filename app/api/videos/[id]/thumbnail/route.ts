import { NextResponse } from "next/server"
import { GridFSBucket, ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/mongodb"
import { Video } from "@/lib/models"

interface Params {
  params: {
    id: string
  }
}

export async function GET(request: Request, { params }: Params) {
  try {
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

    // If no thumbnail, return default
    if (!video.thumbnailId) {
      return NextResponse.json({ error: "No thumbnail available" }, { status: 404 })
    }

    // Get file info
    const file = await db.collection("fs.files").findOne({ _id: new ObjectId(video.thumbnailId) })

    if (!file) {
      return NextResponse.json({ error: "Thumbnail file not found" }, { status: 404 })
    }

    // Stream thumbnail
    const downloadStream = bucket.openDownloadStream(new ObjectId(video.thumbnailId))

    // Convert stream to response
    const chunks: Uint8Array[] = []
    for await (const chunk of downloadStream) {
      chunks.push(chunk)
    }
    const body = Buffer.concat(chunks)

    return new NextResponse(body, {
      headers: {
        "Content-Type": file.metadata.contentType,
        "Content-Length": file.length.toString(),
      },
    })
  } catch (error) {
    console.error("Error fetching thumbnail:", error)
    return NextResponse.json({ error: "Failed to fetch thumbnail" }, { status: 500 })
  }
}

