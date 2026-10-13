// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticate } from "@/lib/auth"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-jwt-secret"

export async function PUT(request: NextRequest) {
  const { user: currentUser, error: authError } = await authenticate(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { name, email, currentPassword, newPassword } = body

    // 1. Fetch current user record with password hash
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      )
    }

    const updateData: Record<string, any> = {}

    // 2. Handle Name Update
    if (name && name.trim() !== "") {
      updateData.name = name.trim()
    }

    // 3. Handle Email Update
    if (email && email.trim() !== "" && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: email.trim() } })
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Email is already in use by another account" },
          { status: 400 }
        )
      }
      updateData.email = email.trim()
    }

    // 4. Handle Password Update
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is required to set a new password" },
          { status: 400 }
        )
      }

      // Verify current password
      if (!user.password) {
        return NextResponse.json(
          { success: false, error: "Password change not available for OAuth accounts" },
          { status: 400 }
        )
      }

      const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password)
      if (!isPasswordCorrect) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 400 }
        )
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 6 characters long" },
          { status: 400 }
        )
      }

      updateData.password = await bcrypt.hash(newPassword, 10)
    }

    // Return if nothing to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields provided to update" },
        { status: 400 }
      )
    }

    // 5. Update user in Database
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.userId },
      data: updateData,
    })

    // 6. Issue updated JWT token
    const token = jwt.sign(
      { userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    })
  } catch (error: any) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    )
  }
}