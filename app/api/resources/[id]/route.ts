import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { Prisma } from "@/app/generated/prisma/client"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/resources/[id] - Fetch single resource
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: { category: true, reservations: true },
    })

    if (!resource) {
      return NextResponse.json({ success: false, error: "Resource not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: resource })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch resource" }, { status: 500 })
  }
}

// PUT /api/resources/[id] - Update resource details
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireAdmin(request)
  if (error) return error // Automatically returns 401 Unauthorized or 403 Forbidden
  try {
    const { id } = await params
    const body = await request.json()

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.location && { location: body.location }),
        ...(body.capacity && { capacity: Number(body.capacity) }),
        ...(body.categoryId && { categoryId: body.categoryId }),
      },
    })

    return NextResponse.json({ success: true, data: resource })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update resource" }, { status: 500 })
  }
}

// DELETE /api/resources/[id] - Delete a resource (ADMIN only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // 1. Enforce Admin Access
  const { error } = await requireAdmin(request)
  if (error) return error

  try {
    const { id } = await params

    // 2. Perform Delete
    await prisma.resource.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Resource deleted successfully" })
  } catch (error: unknown) {
    // 3. Handle specific Prisma error codes
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025: Record to delete does not exist
      if (error.code === "P2025") {
        return NextResponse.json(
          { success: false, error: "Resource not found" },
          { status: 404 }
        )
      }

      // P2003: Foreign key constraint failed (has linked reservations)
      if (error.code === "P2003") {
        return NextResponse.json(
          { success: false, error: "Cannot delete resource with linked reservations. Cancel or remove associated bookings first." },
          { status: 400 }
        )
      }
    }

    console.error("Error deleting resource:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete resource" },
      { status: 500 }
    )
  }
}