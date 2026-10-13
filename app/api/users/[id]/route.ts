// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticate, requireAdmin } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { Prisma } from "@/app/generated/prisma/client"

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
        reservations: {
          include: {
            resource: { select: { id: true, name: true, location: true } },
          },
        },
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

    const updateData: Record<string, any> = {}
    if (name && name.trim() !== "") updateData.name = name.trim()
    if (email && email.trim() !== "") updateData.email = email.trim()

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 6 characters long" },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Safely parse role only if provided and requested by an Admin
    if (role && currentUser?.role === ADMIN_ROLE) {
      updateData.role = role.toUpperCase()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields provided for update" },
        { status: 400 }
      )
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
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json(
          { success: false, error: "An account with this email address already exists" },
          { status: 409 }
        )
      }
      if (err.code === "P2025") {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    )
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
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete user or user has active reservations" },
      { status: 500 }
    )
  }
}