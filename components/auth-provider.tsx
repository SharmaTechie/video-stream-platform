"use client"

import type React from "react"

import { createContext, useEffect, useState } from "react"
import { getCurrentUser } from "@/lib/auth-actions"

interface User {
  id: string
  username: string
  email: string
  profilePicture?: string
}

interface AuthContextType {
  user: User | null
  status: "authenticated" | "unauthenticated" | "loading"
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  status: "loading",
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<"authenticated" | "unauthenticated" | "loading">("loading")

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getCurrentUser()
        if (userData) {
          setUser(userData)
          setStatus("authenticated")
        } else {
          setUser(null)
          setStatus("unauthenticated")
        }
      } catch (error) {
        console.error("Failed to load user:", error)
        setUser(null)
        setStatus("unauthenticated")
      }
    }

    loadUser()
  }, [])

  return <AuthContext.Provider value={{ user, status }}>{children}</AuthContext.Provider>
}

