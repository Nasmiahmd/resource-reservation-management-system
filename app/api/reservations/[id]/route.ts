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

// PUT /api/reservations/[id] - Update reservation times/resource (Modify Booking)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { user: currentUser, error: authError } = await authenticate(request)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const { startTime, endTime, resourceId, status } = body

    // 1. Fetch existing reservation to check ownership
    const existing = await prisma.reservation.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      )
    }

    // 2. Ownership Guard
    if (currentUser.role !== Role.ADMIN && existing.userId !== currentUser.userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only update your own reservation" },
        { status: 403 }
      )
    }

    const targetResourceId = resourceId || existing.resourceId
    const newStartTime = startTime ? new Date(startTime) : existing.startTime
    const newEndTime = endTime ? new Date(endTime) : existing.endTime

    // 3. Time Validation
    if (newStartTime >= newEndTime) {
      return NextResponse.json(
        { success: false, error: "End time must be after start time" },
        { status: 400 }
      )
    }

    // 4. Schedule Conflict Check (prevent overlapping bookings)
    const conflict = await prisma.reservation.findFirst({
      where: {
        id: { not: id },
        resourceId: targetResourceId,
        status: ReservationStatus.CONFIRMED,
        startTime: { lt: newEndTime },
        endTime: { gt: newStartTime },
      },
    })

    if (conflict) {
      return NextResponse.json(
        { success: false, error: "This resource is already reserved for the selected timeframe" },
        { status: 409 }
      )
    }

    // 5. Update Record
    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        resourceId: targetResourceId,
        startTime: newStartTime,
        endTime: newEndTime,
        ...(status ? { status } : {}),
      },
      include: {
        resource: { select: { id: true, name: true, location: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to update reservation" },
      { status: 500 }
    )
  }
}

// PATCH /api/reservations/[id] - Update status only (e.g. Cancel)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const existing = await prisma.reservation.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      )
    }

    if (currentUser.role !== Role.ADMIN && existing.userId !== currentUser.userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only update your own reservation" },
        { status: 403 }
      )
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        resource: { select: { id: true, name: true, location: true } },
      },
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
  const { user: currentUser, error: authError } = await authenticate(request)
  if (authError) return authError

  try {
    const { id } = await params
    const existing = await prisma.reservation.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      )
    }

    if (currentUser.role !== Role.ADMIN && existing.userId !== currentUser.userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only delete your own reservation" },
        { status: 403 }
      )
    }

    await prisma.reservation.delete({ where: { id } })

    return NextResponse.json({ success: true, data: { id } })
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