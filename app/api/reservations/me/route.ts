import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticate } from "@/lib/auth"

// GET /api/reservations/me - Fetch all reservations belonging to the authenticated user
export async function GET(request: NextRequest) {
  // 1. Authenticate request and extract logged-in user details from JWT
  const { user: currentUser, error: authError } = await authenticate(request)
  if (authError) return authError

  try {
    // 2. Query reservations scoped strictly to currentUser.userId
    const reservations = await prisma.reservation.findMany({
      where: {
        userId: currentUser.userId,
      },
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            location: true,
            capacity: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    })

    return NextResponse.json({ success: true, data: reservations })
  } catch (error) {
    console.error("Error fetching user's reservations:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch your reservations" },
      { status: 500 }
    )
  }
}