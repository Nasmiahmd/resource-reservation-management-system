// src/lib/auth.ts
import jwt from "jsonwebtoken"
import { NextRequest, NextResponse } from "next/server"

// Keep the role type local; Prisma does not export Role in this setup.
type Role = "USER" | "ADMIN"

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key"

export interface JWTPayload {
  userId: string
  email: string
  role: Role
}

// Generate JWT token
export function signJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" })
}

// Verify JWT token
export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

// Middleware Helper: Authenticate any active user (USER or ADMIN)
export async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: "Unauthorized: Missing or invalid token format" },
        { status: 401 }
      ),
    }
  }

  const token = authHeader.split(" ")[1]
  const decoded = verifyJWT(token)

  if (!decoded) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: "Unauthorized: Token is invalid or expired" },
        { status: 401 }
      ),
    }
  }

  return { user: decoded, error: null }
}

// Middleware Helper: Strictly require ADMIN role
export async function requireAdmin(request: NextRequest) {
  const { user, error } = await authenticate(request)
  if (error) return { user: null, error }

  if (user?.role !== "ADMIN") {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: "Forbidden: Admin privileges required" },
        { status: 403 }
      ),
    }
  }

  return { user, error: null }
}