"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import { reservationService } from "@/services/reservationService"
import { api } from "@/lib/apiClient"
import {
  User,
  ShieldCheck,
  Mail,
  Calendar,
  Layers,
  Key,
  CheckCircle2,
  Clock,
  Edit3,
  Loader2,
  Folder,
  Shield,
  ArrowRight,
  Lock,
  X,
} from "lucide-react"

interface UserProfile {
  id?: string
  name: string
  email: string
  role: "USER" | "ADMIN"
}

export default function ProfilePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)

  // Stats State
  const [stats, setStats] = useState({
    activeBookings: 0,
    totalBookings: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)

  // Modal States
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)

  // Profile Form Inputs
  const [nameInput, setNameInput] = useState("")
  const [emailInput, setEmailInput] = useState("")

  // Password Form Inputs
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Form Status States
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")

    if (!token || !storedUser) {
      router.replace("/login")
      return
    }

    try {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      setNameInput(parsedUser.name)
      setEmailInput(parsedUser.email)

      // Fetch user's booking stats
      reservationService.getMine().then((res) => {
        if (res.success && res.data) {
          const active = res.data.filter((b) => b.status === "CONFIRMED").length
          setStats({
            activeBookings: active,
            totalBookings: res.data.length,
          })
        }
        setStatsLoading(false)
      })
    } catch (err) {
      console.error("Failed to parse user data:", err)
      router.replace("/login")
    }
  }, [router])

  // Open Profile Edit Modal
  const handleOpenProfileModal = () => {
    if (!user) return
    setNameInput(user.name)
    setEmailInput(user.email)
    setModalError("")
    setIsEditingProfile(true)
  }

  // Open Password Edit Modal
  const handleOpenPasswordModal = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setModalError("")
    setIsEditingPassword(true)
  }

  // Update Name & Email
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError("")

    if (!nameInput.trim() || !emailInput.trim()) {
      setModalError("Name and Email cannot be empty")
      return
    }

    setSubmitting(true)

    const res = await api.put<{ token?: string; user?: UserProfile }>("/api/profile", {
      name: nameInput.trim(),
      email: emailInput.trim(),
    })

    setSubmitting(false)

    if (res.success && res.data) {
      const updatedUser = res.data.user || { ...user!, name: nameInput, email: emailInput }
      if (res.data.token) {
        localStorage.setItem("token", res.data.token)
      }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
      setIsEditingProfile(false)
      setMessage({ type: "success", text: "Profile details updated successfully!" })
    } else {
      setModalError(res.error || "Failed to update profile details.")
    }
  }

  // Change Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError("")

    if (!currentPassword) {
      setModalError("Please enter your current password")
      return
    }

    if (newPassword.length < 6) {
      setModalError("New password must be at least 6 characters long")
      return
    }

    if (newPassword !== confirmPassword) {
      setModalError("New passwords do not match")
      return
    }

    setSubmitting(true)

    const res = await api.put("/api/profile", {
      currentPassword,
      newPassword,
    })

    setSubmitting(false)

    if (res.success) {
      setIsEditingPassword(false)
      setMessage({ type: "success", text: "Password changed successfully!" })
    } else {
      setModalError(res.error || "Failed to change password.")
    }
  }

  if (!mounted || !user) return null

  const isAdmin = user.role === "ADMIN"

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Banner Notice */}
        {message && (
          <div
            className={`mb-6 flex items-center justify-between rounded-xl p-4 text-sm font-medium border ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-xs underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar Initial */}
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-2xl font-black text-3xl shadow-inner ${
                  isAdmin
                    ? "bg-linear-to-br from-blue-600 to-indigo-700 text-white"
                    : "bg-slate-800 text-white"
                }`}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                      isAdmin ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {isAdmin ? (
                      <>
                        <ShieldCheck size={14} className="text-blue-600" /> System Admin
                      </>
                    ) : (
                      <>
                        <User size={14} className="text-gray-500" /> Lab Member
                      </>
                    )}
                  </span>
                </div>

                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                  <Mail size={15} className="text-gray-400" /> {user.email}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleOpenProfileModal}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shrink-0"
              >
                <Edit3 size={16} /> Edit Info
              </button>
              <button
                onClick={handleOpenPasswordModal}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shrink-0"
              >
                <Lock size={16} /> Security
              </button>
            </div>
          </div>
        </div>

        {/* Main Section Grid */}
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Left Column: Quick Stats */}
          <div className="space-y-6 md:col-span-1">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
                Booking Activity
              </h2>

              {statsLoading ? (
                <div className="flex items-center justify-center py-6 text-gray-400">
                  <Loader2 className="animate-spin" size={20} />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-blue-50/60 p-4 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-600 p-2 text-white">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Active Slots</p>
                        <p className="text-xl font-extrabold text-blue-900">
                          {stats.activeBookings}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-slate-700 p-2 text-white">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Total History</p>
                        <p className="text-xl font-extrabold text-gray-800">
                          {stats.totalBookings}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Link
                href="/reservations"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                View My Bookings <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Right Column: Role Privileges & Fast Links */}
          <div className="space-y-6 md:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="text-blue-600" size={20} />
                <h2 className="text-base font-bold text-gray-900">
                  {isAdmin ? "Admin Capabilities & Access" : "Member Privileges"}
                </h2>
              </div>

              {isAdmin ? (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500">
                    As an Administrator, you have full privileges to configure lab resources, add categories, and manage employee reservations across Britto Lab.
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
                    <Link
                      href="/admin/resources"
                      className="flex flex-col justify-between rounded-xl border border-gray-200 p-4 hover:border-blue-500 hover:shadow-sm transition bg-slate-50/50"
                    >
                      <Layers size={20} className="text-blue-600" />
                      <div className="mt-3">
                        <span className="text-sm font-bold text-gray-900">Manage Resources</span>
                        <p className="text-[11px] text-gray-500 mt-0.5">Add, edit, or remove lab gear</p>
                      </div>
                    </Link>

                    <Link
                      href="/admin/categories"
                      className="flex flex-col justify-between rounded-xl border border-gray-200 p-4 hover:border-blue-500 hover:shadow-sm transition bg-slate-50/50"
                    >
                      <Folder size={20} className="text-blue-600" />
                      <div className="mt-3">
                        <span className="text-sm font-bold text-gray-900">Categories</span>
                        <p className="text-[11px] text-gray-500 mt-0.5">Organize equipment groups</p>
                      </div>
                    </Link>

                    <Link
                      href="/admin/reservations"
                      className="flex flex-col justify-between rounded-xl border border-gray-200 p-4 hover:border-blue-500 hover:shadow-sm transition bg-slate-50/50"
                    >
                      <Calendar size={20} className="text-blue-600" />
                      <div className="mt-3">
                        <span className="text-sm font-bold text-gray-900">System Bookings</span>
                        <p className="text-[11px] text-gray-500 mt-0.5">Override or cancel schedules</p>
                      </div>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    Your account grants you access to browse equipment, submit reservations, and update your personal schedules.
                  </p>
                  <ul className="space-y-2 text-xs text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-600" />
                      Reserve lab resources and test benches
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-600" />
                      Modify or cancel personal bookings
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-600" />
                      Conflict-free database verification
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Credentials & Settings Info */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Key className="text-gray-600" size={20} />
                  <h2 className="text-base font-bold text-gray-900">Security Details</h2>
                </div>
                <button
                  onClick={handleOpenPasswordModal}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Change Password
                </button>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Authentication Method</span>
                  <span className="font-semibold text-gray-800">JWT Token / OAuth</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200/60 pt-3">
                  <span className="text-gray-500">Role Authority</span>
                  <span className="font-semibold text-gray-800">{user.role}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Info Modal */}
        {isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-lg font-bold text-gray-900">Edit Personal Info</h3>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              {modalError && (
                <div className="mt-4 rounded-md bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="w-1/2 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-1/2 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="animate-spin" size={16} />}
                    Save Info
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {isEditingPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
                <button
                  onClick={() => setIsEditingPassword(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              {modalError && (
                <div className="mt-4 rounded-md bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 tracking-wider">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 tracking-wider">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 tracking-wider">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditingPassword(false)}
                    className="w-1/2 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-1/2 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="animate-spin" size={16} />}
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}