import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { Prisma } from "@/app/generated/prisma/client"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/categories/[id] - Fetch single category with its resources
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        resources: true,
        _count: { select: { resources: true } },
      },
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch category" },
      { status: 500 }
    )
  }
}

// PUT /api/categories/[id] - Update category details (ADMIN & OWN only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin(request)
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    const { name, description } = body

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    })

    return NextResponse.json({ success: true, data: category })
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to update category" },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Delete category (ADMIN only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin(request)
  if (error) return error

  try {
    const { id } = await params

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    })
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { success: false, error: "Category not found" },
          { status: 404 }
        )
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot delete category with assigned resources. Reassign or delete linked resources first.",
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete category" },
      { status: 500 }
    )
  }
}