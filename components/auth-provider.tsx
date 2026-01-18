"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface AuthContextType {
  isAuthenticated: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Credentials - can be set via environment variables or use defaults
// Set NEXT_PUBLIC_AUTH_USERNAME and NEXT_PUBLIC_AUTH_PASSWORD in .env.local
const AUTH_USERNAME = process.env.NEXT_PUBLIC_AUTH_USERNAME
const AUTH_PASSWORD = process.env.NEXT_PUBLIC_AUTH_PASSWORD

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem("wishlist-auth")
    setIsAuthenticated(authStatus === "authenticated")
    setIsLoading(false)
  }, [])

  const login = (username: string, password: string): boolean => {
    if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
      localStorage.setItem("wishlist-auth", "authenticated")
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem("wishlist-auth")
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
