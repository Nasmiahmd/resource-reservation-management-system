import { NextRequest, NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { Role } from "@/app/generated/prisma/client"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-jwt-secret"

// POST /api/auth/google - Sign in / Sign up with Google OAuth
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { credential } = body // Google ID token sent from frontend

    if (!credential) {
      return NextResponse.json(
        { success: false, error: "Google credential ID token is required" },
        { status: 400 }
      )
    }

    // 1. Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload || !payload.email) {
      return NextResponse.json(
        { success: false, error: "Invalid Google token payload" },
        { status: 400 }
      )
    }

    const { email, name, sub: googleId, picture, hd } = payload

    // 2. Domain Lockdown Check (Optional)
    const allowedDomain = process.env.ALLOWED_DOMAIN
    if (allowedDomain && hd !== allowedDomain) {
      return NextResponse.json(
        { success: false, error: `Access forbidden: Only @${allowedDomain} accounts are permitted` },
        { status: 403 }
      )
    }

    // 3. Find or Upsert User
    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      // Determine role based on ADMIN_EMAILS environment variable
      const adminEmails = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())

      const role = adminEmails.includes(email.toLowerCase()) ? Role.ADMIN : Role.USER

      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          googleId,
          role,
        },
      })
    } else if (!user.googleId) {
      // Link Google ID to an existing email/password account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      })
    }

    // 4. Issue System JWT Token (Preserves full compatibility with your current middleware & RBAC)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          picture,
        },
      },
    })
  } catch (error: unknown) {
    console.error("Google Auth Error:", error)
    return NextResponse.json(
      { success: false, error: "Google authentication failed" },
      { status: 400 }
    )
  }
}