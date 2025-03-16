import type { Db, ObjectId } from "mongodb"
import { GridFSBucket } from "mongodb"
import { spawn } from "child_process"
import fs from "fs"
import path from "path"
import os from "os"

interface Resolutions {
  "360p"?: ObjectId
  "720p"?: ObjectId
  "1080p"?: ObjectId
}

export async function processVideo(db: Db, fileId: ObjectId): Promise<Resolutions> {
  const bucket = new GridFSBucket(db)
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "video-processing-"))
  const inputPath = path.join(tempDir, "input.mp4")
  const resolutions: Resolutions = {}

  try {
    // Download the original file
    const downloadStream = bucket.openDownloadStream(fileId)
    const writeStream = fs.createWriteStream(inputPath)

    await new Promise<void>((resolve, reject) => {
      downloadStream.pipe(writeStream)
      writeStream.on("finish", resolve)
      writeStream.on("error", reject)
    })

    // Process to different resolutions
    const resolutionConfigs = [
      { name: "360p", height: 360, bitrate: "800k" },
      { name: "720p", height: 720, bitrate: "2500k" },
      { name: "1080p", height: 1080, bitrate: "5000k" },
    ]

    for (const config of resolutionConfigs) {
      const outputPath = path.join(tempDir, `${config.name}.mp4`)

      // Use ffmpeg to convert
      await new Promise<void>((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [
          "-i",
          inputPath,
          "-vf",
          `scale=-2:${config.height}`,
          "-c:v",
          "libx264",
          "-b:v",
          config.bitrate,
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          outputPath,
        ])

        ffmpeg.on("close", (code) => {
          if (code === 0) {
            resolve()
          } else {
            reject(new Error(`ffmpeg process exited with code ${code}`))
          }
        })
      })

      // Upload the processed file to GridFS
      const fileBuffer = fs.readFileSync(outputPath)
      const uploadStream = bucket.openUploadStream(`${config.name}.mp4`, {
        metadata: {
          contentType: "video/mp4",
          resolution: config.name,
          originalFileId: fileId,
        },
      })

      await new Promise<void>((resolve, reject) => {
        uploadStream.on("finish", resolve)
        uploadStream.on("error", reject)
        uploadStream.end(fileBuffer)
      })

      // Store the file ID for this resolution
      resolutions[config.name as keyof Resolutions] = uploadStream.id
    }

    return resolutions
  } catch (error) {
    console.error("Error processing video:", error)
    return {}
  } finally {
    // Clean up temp files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch (error) {
      console.error("Error cleaning up temp files:", error)
    }
  }
}

