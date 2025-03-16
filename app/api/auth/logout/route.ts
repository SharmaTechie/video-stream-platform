import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  const cookiesInstance = await cookies()
  cookiesInstance.set({
    name: "auth_token",
    value: "",
    expires: new Date(0),
    path: "/",
  })

  return NextResponse.json({ success: true })
}

