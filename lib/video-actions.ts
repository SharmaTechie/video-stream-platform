"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

type ProgressCallback = (progress: number) => void

export async function uploadVideo(formData: FormData, onProgress?: ProgressCallback) {
  try {
    const token = (await cookies()).get("auth_token")?.value 


    if (!token) {
      return { success: false, error: "Unauthorized" }
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/videos/upload`, {
      method: "POST",
      headers: {
        Cookie: `auth_token=${token}`,
      },
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error }
    }

    revalidatePath("/")
    return { success: true, videoId: result.videoId }
  } catch (error) {
    console.error("Video upload error:", error)
    return { success: false, error: "Something went wrong" }
  }
}

export async function likeVideo(videoId: string) {
  try {
    const token = (await cookies()).get("auth_token")?.value

    if (!token) {
      return { success: false, error: "Unauthorized" }
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/videos/${videoId}/like`, {
      method: "POST",
      headers: {
        Cookie: `auth_token=${token}`,
      },
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error }
    }

    revalidatePath(`/video/${videoId}`)
    return { success: true }
  } catch (error) {
    console.error("Like video error:", error)
    return { success: false, error: "Something went wrong" }
  }
}

export async function deleteVideo(videoId: string) {
  try {
    const token = (await cookies()).get("auth_token")?.value

    if (!token) {
      return { success: false, error: "Unauthorized" }
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/videos/${videoId}`, {
      method: "DELETE",
      headers: {
        Cookie: `auth_token=${token}`,
      },
    })

    if (!response.ok) {
      const result = await response.json()
      return { success: false, error: result.error }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Delete video error:", error)
    return { success: false, error: "Something went wrong" }
  }
}

