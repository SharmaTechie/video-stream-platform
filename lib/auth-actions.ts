"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

interface RegisterData {
  username: string
  email: string
  password: string
}

interface LoginData {
  email: string
  password: string
}

export async function registerUser(data: RegisterData) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error }
    }

    return { success: true, user: result.user }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, error: "Something went wrong" }
  }
}

export async function loginUser(data: LoginData) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error }
    }

    revalidatePath("/")
    return { success: true, user: result.user }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Something went wrong" }
  }
}

export async function logoutUser() {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/logout`, {
      method: "POST",
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Logout error:", error)
    return { success: false, error: "Something went wrong" }
  }
}

export async function getCurrentUser() {
  const token = await (await cookies()).get("auth_token")?.value  
   
  if(!token) {
    return null
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/me`, {
      headers: {
        Cookie: `auth_token=${token}`,
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

