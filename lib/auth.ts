import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { User } from "@/lib/models"
import { connectToDatabase } from "@/lib/mongodb"

interface Session {
  user: {
    id: string
    username: string
    email: string
  }
}

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies()  
  const token = cookieStore.get("auth_token")?.value


  if (!token) {
    return null
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET || "fallback_secret") as {
      id: string
      username: string
      email: string
    }

    return {
      user: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
      },
    }
  } catch (error) {
    return null
  }
}

export async function authMiddleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET || "fallback_secret") as {
      id: string
    }

    await connectToDatabase()

    const user = await User.findById(decoded.id)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return null // Continue to the route handler
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

