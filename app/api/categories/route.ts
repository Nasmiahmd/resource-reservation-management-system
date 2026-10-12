import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

// GET /api/categories - List all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { resources: true } },
      },
      orderBy: { name: "asc" },
    })
    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a new category (ADMIN only)
export async function POST(request: NextRequest) {
  // 1. Enforce Admin JWT Verification
  const { error } = await requireAdmin(request)
  if (error) return error

  try {
    const body = await request.json()
    const { name, description } = body

    // 2. Input Validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 }
      )
    }

    // 3. Create Category in Database
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description ? String(description).trim() : null,
      },
    })

    return NextResponse.json({ success: true, data: category }, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating category:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create category" },
      { status: 500 }
    )
  }
}