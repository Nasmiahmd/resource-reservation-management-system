// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticate, requireAdmin } from "@/lib/auth"
import bcrypt from "bcryptjs"

const ADMIN_ROLE = "ADMIN"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/users/[id] - Fetch user profile (ADMIN or Self)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { user: currentUser, error } = await authenticate(request)
  if (error) return error

  const { id } = await params

  // Non-admins can only access their own profile
  if (currentUser?.role !== ADMIN_ROLE && currentUser?.userId !== id) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Access denied" },
      { status: 403 }
    )
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        reservations: true,
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to fetch user" }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update user (ADMIN or Self)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { user: currentUser, error } = await authenticate(request)
  if (error) return error

  const { id } = await params

  if (currentUser?.role !== ADMIN_ROLE && currentUser?.userId !== id) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Access denied" },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { name, email, password, role } = body

    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (password) updateData.password = await bcrypt.hash(password, 10)

    // Only Admins can change roles
    if (role && currentUser.role === ADMIN_ROLE) {
      updateData.role = role
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json({ success: true, data: updatedUser })
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete user (ADMIN only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin(request)
  if (error) return error

  const { id } = await params

  try {
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "User deleted successfully" })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Failed to delete user or user has existing dependencies" },
      { status: 500 }
    )
  }
}