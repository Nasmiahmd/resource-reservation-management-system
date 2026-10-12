import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ReservationStatus, Role, Prisma } from "@/app/generated/prisma/client"
import { authenticate } from "@/lib/auth"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/reservations/[id] - Fetch single reservation details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { user: currentUser, error: authError } = await authenticate(request)
  if (authError) return authError

  try {
    const { id } = await params
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        resource: { select: { id: true, name: true, location: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      )
    }

    // Guard: Users can only view their own reservations; Admins can view any
    if (currentUser.role !== Role.ADMIN && reservation.userId !== currentUser.userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You cannot view this reservation" },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, data: reservation })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch reservation" },
      { status: 500 }
    )
  }
}

// PATCH /api/reservations/[id] - Update reservation status (e.g. Cancel)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  // 1. Authenticate Request
  const { user: currentUser, error: authError } = await authenticate(request)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !Object.values(ReservationStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: "Valid ReservationStatus is required" },
        { status: 400 }
      )
    }

    // 2. Fetch reservation to verify existence & ownership
    const existing = await prisma.reservation.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      )
    }

    // 3. Ownership Guard: Regular users can only modify their own reservations
    if (currentUser.role !== Role.ADMIN && existing.userId !== currentUser.userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only update your own reservation" },
        { status: 403 }
      )
    }

    // 4. Update status in DB
    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ success: true, data: updatedReservation })
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to update reservation status" },
      { status: 500 }
    )
  }
}

// DELETE /api/reservations/[id] - Delete reservation record
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // 1. Authenticate Request
  const { user: currentUser, error: authError } = await authenticate(request)
  if (authError) return authError

  try {
    const { id } = await params

    // 2. Fetch reservation to verify existence & ownership
    const existing = await prisma.reservation.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      )
    }

    // 3. Ownership Guard: Regular users can only delete their own reservations
    if (currentUser.role !== Role.ADMIN && existing.userId !== currentUser.userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only delete your own reservation" },
        { status: 403 }
      )
    }

    // 4. Perform deletion
    await prisma.reservation.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Reservation deleted successfully" })
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete reservation" },
      { status: 500 }
    )
  }
}