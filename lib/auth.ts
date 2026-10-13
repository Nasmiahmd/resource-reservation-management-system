// src/lib/auth.ts
import { NextRequest, NextResponse } from "next/server"
import jwt, { JwtPayload } from "jsonwebtoken"

// Custom JwtPayload interface
export interface UserJwtPayload extends JwtPayload {
  id: string
  email: string
  role: "USER" | "ADMIN"
  name?: string
  imageUrl?: string | null
}

// 1. Export signJWT helper function for login/registration routes
export function signJWT(
  payload: Record<string, any>,
  expiresIn: string | number = "7d"
): string {
  const secret = process.env.JWT_SECRET || "fallback_jwt_secret"
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any })
}

// 2. Authenticate request middleware helper
export async function authenticate(request: NextRequest): Promise<{
  user: UserJwtPayload | null
  error: NextResponse | null
}> {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        user: null,
        error: NextResponse.json(
          { success: false, error: "Authentication token required" },
          { status: 401 }
        ),
      }
    }

    const token = authHeader.split(" ")[1]
    const secret = process.env.JWT_SECRET || "fallback_jwt_secret"
    const decoded = jwt.verify(token, secret) as UserJwtPayload

    return { user: decoded, error: null }
  } catch (err) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      ),
    }
  }
}

// 3. Require Admin role middleware helper
export async function requireAdmin(request: NextRequest): Promise<{
  user: UserJwtPayload | null
  error: NextResponse | null
}> {
  const { user, error } = await authenticate(request)
  if (error || !user) {
    return { user: null, error }
  }

  if (user.role !== "ADMIN") {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      ),
    }
  }

  return { user, error: null }
}