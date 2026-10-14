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
      { status: 401 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedUserId = searchParams.get("userId") || undefined;
    const resourceId = searchParams.get("resourceId") || undefined;
    const isMineOnly = searchParams.get("mine") === "true";

    let targetUserId: string | undefined = requestedUserId;

    // 2. Role-Based Access Rules & Scope Resolution
    if (isMineOnly) {
      // Force filter to current user's reservations (for "My Bookings" page)
      targetUserId = currentUser.userId;
    } else if (currentUser.role !== Role.ADMIN) {
      if (requestedUserId && requestedUserId !== currentUser.userId) {
        // Regular users cannot view another user's reservation history
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: You can only view your own reservations",
          },
          { status: 403 }
        );
      }

      // Default regular users to fetching only their own bookings if no resource filter is provided
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
      { status: 500 }
    );
  }
}

// POST /api/reservations - Create a booking with capacity & conflict checking
export async function POST(request: NextRequest) {
  // 1. Authenticate incoming request (User or Admin)
  const { user: currentUser, error: authError } = await authenticate(request);
  if (authError) return authError;
  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { resourceId, userId, startTime, endTime } = body;

    if (!resourceId || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: resourceId, startTime, endTime",
        },
        { status: 400 }
      );
    }

    // 2. Resolve User ID safely (handles tokens formatted with .userId or .id)
    const authenticatedUserId = currentUser.userId || currentUser.id;

    if (!authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "User ID could not be identified from authentication token" },
        { status: 401 }
      );
    }

    // Validate Ownership vs Admin Privileges
    let targetUserId = authenticatedUserId;

    if (currentUser.role === Role.ADMIN && userId) {
      targetUserId = userId;
    } else if (
      currentUser.role !== Role.ADMIN &&
      userId &&
      userId !== authenticatedUserId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You cannot create reservations for another user",
        },
        { status: 403 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // 3. Time Validations
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date format provided" },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        { success: false, error: "End time must be after start time" },
        { status: 400 }
      );
    }

    if (start < new Date()) {
      return NextResponse.json(
        { success: false, error: "Start time cannot be in the past" },
        { status: 400 }
      );
    }

    // 4. Database transaction with capacity-aware overlap checking & explicit relation connection
    const reservation = await prisma.$transaction(
      async (tx) => {
        // A. Fetch resource capacity
        const resource = await tx.resource.findUnique({
          where: { id: resourceId },
          select: { capacity: true },
        });

        if (!resource) {
          throw new Error("RESOURCE_NOT_FOUND");
        }

        // B. Count existing active reservations overlapping with requested slot
        const activeConflicts = await tx.reservation.count({
          where: {
            resourceId,
            status: ReservationStatus.CONFIRMED,
            AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
          },
        });

        // C. Check if requested slot exceeds total available capacity
        if (activeConflicts >= resource.capacity) {
          throw new Error("RESOURCE_FULLY_BOOKED");
        }

        // D. Create reservation using explicit relation 'connect' syntax
        return await tx.reservation.create({
          data: {
            startTime: start,
            endTime: end,
            status: ReservationStatus.CONFIRMED,
            user: { connect: { id: targetUserId } },
            resource: { connect: { id: resourceId } },
          },
          include: {
            resource: { select: { id: true, name: true, location: true } },
            user: { select: { id: true, name: true, email: true } },
          },
        });
      },
      {
        maxWait: 10000, // Handle Neon cold starts
        timeout: 15000,
      }
    );

    return NextResponse.json(
      { success: true, data: reservation },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";

    if (message === "RESOURCE_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Resource not found" },
        { status: 404 }
      );
    }

    if (message === "RESOURCE_FULLY_BOOKED") {
      return NextResponse.json(
        {
          success: false,
          error: "This resource is fully booked for the selected time range",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: message || "Failed to process reservation",
      },
      { status: 500 }
    );
  }
}