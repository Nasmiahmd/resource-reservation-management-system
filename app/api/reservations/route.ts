import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReservationStatus, Role } from "@/app/generated/prisma/client";
import { authenticate } from "@/lib/auth";

// GET /api/reservations - Fetch reservations with RBAC & filtering
export async function GET(request: NextRequest) {
  // 1. Authenticate request (USER or ADMIN)
  const { user: currentUser, error: authError } = await authenticate(request);
  if (authError) return authError;
  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedUserId = searchParams.get("userId") || undefined;
    const resourceId = searchParams.get("resourceId") || undefined;

    let targetUserId: string | undefined = requestedUserId;

    // 2. Role-Based Access Rules
    if (currentUser.role !== Role.ADMIN) {
      if (requestedUserId && requestedUserId !== currentUser.userId) {
        // Regular users cannot view another user's reservation history
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: You can only view your own reservations",
          },
          { status: 403 },
        );
      }

      // If no resourceId filter is provided, default regular users to fetching only their own bookings
      if (!requestedUserId && !resourceId) {
        targetUserId = currentUser.userId;
      }
    }

    // 3. Query Database
    const reservations = await prisma.reservation.findMany({
      where: {
        ...(targetUserId && { userId: targetUserId }),
        ...(resourceId && { resourceId }),
      },
      include: {
        resource: { select: { id: true, name: true, location: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({ success: true, data: reservations });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reservations" },
      { status: 500 },
    );
  }
}

// POST /api/reservations - Create a booking with conflict checking
export async function POST(request: NextRequest) {
  // 1. Authenticate incoming request (User or Admin)
  const { user: currentUser, error: authError } = await authenticate(request);
  if (authError) return authError;
  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { resourceId, userId, startTime, endTime } = body;

    // Omit userId here so standard users don't have to pass it explicitly in body
    if (!resourceId || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: resourceId, startTime, endTime",
        },
        { status: 400 },
      );
    }

    // 2. Validate Ownership vs Admin Privileges
    // Regular users can only book for themselves. Admins can specify any userId.
    let targetUserId = currentUser.userId;

    if (currentUser.role === Role.ADMIN && userId) {
      targetUserId = userId;
    } else if (
      currentUser.role !== Role.ADMIN &&
      userId &&
      userId !== currentUser.userId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You cannot create reservations for another user",
        },
        { status: 403 },
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date format provided" },
        { status: 400 },
      );
    }

    if (start >= end) {
      return NextResponse.json(
        { success: false, error: "End time must be after start time" },
        { status: 400 },
      );
    }

    // Database transaction to eliminate double-booking race conditions
    // Update the transaction block in POST /api/reservations
    const reservation = await prisma.$transaction(
      async (tx) => {
        const conflict = await tx.reservation.findFirst({
          where: {
            resourceId,
            status: ReservationStatus.CONFIRMED,
            AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
          },
        });

        if (conflict) {
          throw new Error(
            "Resource is unavailable for the selected time range",
          );
        }

        return await tx.reservation.create({
          data: {
            resourceId,
            userId: targetUserId,
            startTime: start,
            endTime: end,
            status: ReservationStatus.CONFIRMED,
          },
        });
      },
      {
        maxWait: 10000, // 10 seconds to wait for a database connection (handles Neon cold start)
        timeout: 15000, // 15 seconds max execution time for the transaction
      },
    );

    return NextResponse.json(
      { success: true, data: reservation },
      { status: 201 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process reservation",
      },
      { status: 400 },
    );
  }
}



