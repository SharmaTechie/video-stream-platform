"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function getComments(videoId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/videos/${videoId}/comments`)

    if (!response.ok) {
      return { comments: [] }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Get comments error:", error)
    return { comments: [] }
  }
}

export async function addComment(videoId: string, text: string) {
  try {
    const token = (await cookies()).get("auth_token")?.value  

    if (!token) {
      return { success: false, error: "Unauthorized" }
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/videos/${videoId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `auth_token=${token}`,
      },
      body: JSON.stringify({ text }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error }
    }

    revalidatePath(`/video/${videoId}`)
    return { success: true, comment: result.comment }
  } catch (error) {
    console.error("Add comment error:", error)
    return { success: false, error: "Something went wrong" }
  }
}

