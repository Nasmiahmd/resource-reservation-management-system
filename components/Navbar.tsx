"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  LogOut,
  Calendar,
  Layers,
  ShieldCheck,
  Folder,
  CalendarCheck,
  User as UserIcon,
  Users,
  Menu,
  X,
} from "lucide-react"

interface User {
  name: string
  role: string
}

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (err) {
        console.error("Failed to parse stored user:", err)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  // Render a consistent height placeholder during SSR and initial client hydration
  if (!mounted || !user) {
    return <div className="h-16 border-b bg-white shadow-sm" />
  }

  return (
    <nav className="sticky top-0 z-40 border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
        {/* Left: Brand & Desktop Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold text-blue-600 shrink-0">
            Britto <span className="text-gray-800">Lab</span>
          </Link>

          {/* Desktop Links (Visible on lg screens and up) */}
          <div className="hidden lg:flex items-center gap-4 text-sm font-medium text-gray-600">
            <Link href="/dashboard" className="flex items-center gap-1 hover:text-blue-600 transition">
              <Layers size={18} /> Resources
            </Link>
            <Link href="/reservations" className="flex items-center gap-1 hover:text-blue-600 transition">
              <Calendar size={18} /> My Bookings
            </Link>

            {/* Admin Management Links */}
            {user.role === "ADMIN" && (
              <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                <Link
                  href="/admin/resources"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition font-semibold"
                >
                  <Layers size={18} /> Manage Resources
                </Link>
                <Link
                  href="/admin/categories"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition font-semibold"
                >
                  <Folder size={18} /> Categories
                </Link>
                <Link
                  href="/admin/users"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition font-semibold"
                >
                  <Users size={18} /> Users
                </Link>
                <Link
                  href="/admin/reservations"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition font-semibold"
                >
                  <CalendarCheck size={18} /> All System Bookings
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: Desktop Profile & Logout */}
        <div className="hidden lg:flex items-center gap-4">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-gray-50 transition cursor-pointer text-right group"
            title="View Profile"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition">
              {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition">
                {user.name}
              </p>
              <span className="inline-flex items-center text-xs text-gray-500">
                {user.role === "ADMIN" && <ShieldCheck size={12} className="mr-1 text-blue-600" />}
                {user.role}
              </span>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Mobile Hamburger Button (Visible below lg breakpoint) */}
        <div className="flex lg:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none transition"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top duration-200">
          {/* User Profile Summary */}
          <Link
            href="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between rounded-xl bg-gray-50 p-3 hover:bg-blue-50/60 transition"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{user.name}</p>
                <span className="inline-flex items-center text-xs text-gray-500">
                  {user.role === "ADMIN" && <ShieldCheck size={12} className="mr-1 text-blue-600" />}
                  {user.role}
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-600">View Profile →</span>
          </Link>

          {/* User Section Links */}
          <div className="space-y-1">
            <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              User Menu
            </p>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition"
            >
              <Layers size={18} className="text-gray-400" /> Resources
            </Link>
            <Link
              href="/reservations"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition"
            >
              <Calendar size={18} className="text-gray-400" /> My Bookings
            </Link>
          </div>

          {/* Admin Section Links */}
          {user.role === "ADMIN" && (
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Admin Controls
              </p>
              <Link
                href="/admin/resources"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
              >
                <Layers size={18} /> Manage Resources
              </Link>
              <Link
                href="/admin/categories"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
              >
                <Folder size={18} /> Categories
              </Link>
              <Link
                href="/admin/users"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
              >
                <Users size={18} /> Users
              </Link>
              <Link
                href="/admin/reservations"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
              >
                <CalendarCheck size={18} /> All System Bookings
              </Link>
            </div>
          )}

          {/* Mobile Logout */}
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}