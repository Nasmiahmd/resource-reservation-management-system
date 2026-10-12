// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import bcrypt from "bcryptjs"

// GET /api/users - List all users (ADMIN only)
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request)
  if (error) return error

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: { select: { reservations: true } },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ success: true, data: users })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

// POST /api/users - Register/Create a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, email, password" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role === "ADMIN" ? "ADMIN" : "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json({ success: true, data: user }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    )
  }
}