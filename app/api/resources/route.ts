import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticate, requireAdmin } from "@/lib/auth"

// GET /api/resources - Browse and search resources (USER & ADMIN)
export async function GET(request: NextRequest) {
  // 1. Authenticate request
  const { error: authError } = await authenticate(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get("categoryId") || undefined
    const search = searchParams.get("search") || undefined
    const minCapacity = searchParams.get("minCapacity")

    // 2. Query resources with dynamic filters
    const resources = await prisma.resource.findMany({
      where: {
        ...(categoryId && { categoryId }),
        ...(minCapacity && { capacity: { gte: Number(minCapacity) } }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        category: true,
        _count: { select: { reservations: true } },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ success: true, data: resources })
  } catch (error) {
    console.error("Error fetching resources:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch resources" },
      { status: 500 }
    )
  }
}

// POST /api/resources - Create a new resource
export async function POST(request: NextRequest) {
  // 1. Verify JWT and require ADMIN role
  const { user, error } = await requireAdmin(request)
  if (error) return error // Automatically returns 401 Unauthorized or 403 Forbidden

  try {
    const body = await request.json()
    const { name, description, location, capacity, categoryId } = body

    if (!name || !location || !capacity || !categoryId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, location, capacity, categoryId" },
        { status: 400 }
      )
    }

    const resource = await prisma.resource.create({
      data: {
        name,
        description,
        location,
        capacity: Number(capacity),
        categoryId,
      },
    })

    return NextResponse.json({ success: true, data: resource }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create resource" },
      { status: 500 }
    )
  }
}