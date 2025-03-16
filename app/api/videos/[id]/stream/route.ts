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
    const { searchParams } = new URL(request.url)
    const resolution = searchParams.get("resolution") || "original"

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const bucket = new GridFSBucket(db)

    const video = await Video.findById(id)

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Determine which file to stream based on resolution
    let fileId
    if (resolution === "original") 
    {
      fileId = video.fileId
    } 
    else if (video.resolutions && video.resolutions[resolution as keyof typeof video.resolutions]) 
    {
      fileId = video.resolutions[resolution as keyof typeof video.resolutions]
    } 
    else 
    {
      fileId = video.fileId // Fallback to original
    }

    // Get file info
    const file = await db.collection("fs.files").findOne({ _id: new ObjectId(fileId) })

    if (!file) {
      return NextResponse.json({ error: "Video file not found" }, { status: 404 })
    }

    // Get range header
    const range = request.headers.get("range")
    const fileSize = file.length

    if (range) {
      // Parse range
      const parts = range.replace(/bytes=/, "").split("-")
      const start = Number.parseInt(parts[0], 10)
      const end = parts[1] ? Number.parseInt(parts[1], 10) : fileSize - 1
      const chunkSize = end - start + 1

      // Create download stream
      const downloadStream = bucket.openDownloadStream(new ObjectId(fileId), {
        start,
        end: end + 1,
      })

      // Create response
      const headers = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": file.metadata.contentType,
      }

      // Convert stream to response
      const chunks: Uint8Array[] = []
      for await (const chunk of downloadStream) {
        chunks.push(chunk)
      }
      const body = Buffer.concat(chunks)

      return new NextResponse(body, {
        status: 206,
        headers,
      })
    } else {
      // Stream entire file
      const downloadStream = bucket.openDownloadStream(new ObjectId(fileId))

      // Convert stream to response
      const chunks: Uint8Array[] = []
      for await (const chunk of downloadStream) {
        chunks.push(chunk)
      }
      const body = Buffer.concat(chunks)

      return new NextResponse(body, {
        headers: {
          "Content-Length": fileSize.toString(),
          "Content-Type": file.metadata.contentType,
        },
      })
    }
  } catch (error) {
    console.error("Error streaming video:", error)
    return NextResponse.json({ error: "Failed to stream video" }, { status: 500 })
  }
}

