import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/lib/models"

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json()

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectToDatabase()

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email or username already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    })

    await newUser.save()

    // Return success without password
    const { password: _, ...userWithoutPassword } = newUser.toObject()

    return NextResponse.json({ success: true, user: userWithoutPassword }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

