import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticate } from "@/lib/auth"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function PUT(request: NextRequest) {
  // 1. Authenticate Request
  const { user, error } = await authenticate(request)
  if (error || !user) {
    return (
      error ||
      NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    )
  }

  try {
    const body = await request.json()
    const { name, email, imageUrl, currentPassword, newPassword } = body

    // Safely extract ID across different JWT payload structures (id, userId, or sub)
    const targetId = user.id || (user as any).userId || (user as any).sub
    const targetEmail = user.email

    if (!targetId && !targetEmail) {
      return NextResponse.json(
        { success: false, error: "Invalid token: Missing user identifier" },
        { status: 401 }
      )
    }

    // 2. Fetch existing user from PostgreSQL safely
    const existingUser = targetId
      ? await prisma.user.findUnique({ where: { id: targetId } })
      : await prisma.user.findUnique({ where: { email: targetEmail } })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User account not found" },
        { status: 404 }
      )
    }

    // -------------------------------------------------------------
    // Scenario A: Password Update Request
    // -------------------------------------------------------------
    if (currentPassword || newPassword) {
      if (!existingUser.password) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Accounts logged in via Google OAuth do not have a password configured.",
          },
          { status: 400 }
        )
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        existingUser.password
      )
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: "Current password does not match" },
          { status: 400 }
        )
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 6 characters" },
          { status: 400 }
        )
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword },
      })

      return NextResponse.json({
        success: true,
        message: "Password updated successfully",
      })
    }

    // -------------------------------------------------------------
    // Scenario B: Personal Info / Avatar Update Request
    // -------------------------------------------------------------
    if (email && email.toLowerCase() !== existingUser.email.toLowerCase()) {
      const emailCheck = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })
      if (emailCheck) {
        return NextResponse.json(
          { success: false, error: "Email address is already in use" },
          { status: 400 }
        )
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        imageUrl: true,
      },
    })

    // 3. Re-issue updated JWT Token with explicit `id` claim
    const jwtSecret = process.env.JWT_SECRET || "fallback_jwt_secret"
    const token = jwt.sign(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        name: updatedUser.name,
        imageUrl: updatedUser.imageUrl,
      },
      jwtSecret,
      { expiresIn: "7d" }
    )

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        token,
      },
    })
  } catch (err: any) {
    console.error("Profile update route error:", err)
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    )
  }
}