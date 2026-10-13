"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { api } from "@/lib/apiClient"
import {
  Users,
  ShieldCheck,
  User as UserIcon,
  Search,
  Filter,
  Edit2,
  Trash2,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Mail,
  Key,
  Shield,
  CheckCircle2,
} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: "USER" | "ADMIN"
  _count?: {
    reservations: number
  }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null)

  // Search and Filter
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRole, setEditRole] = useState<"USER" | "ADMIN">("USER")
  const [editPassword, setEditPassword] = useState("")
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState("")

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)

    const res = await api.get<User[]>("/api/users")
    if (res.success && res.data) {
      setUsers(res.data)
    } else {
      setError(res.error || "Failed to load system users.")
    }

    setLoading(false)
  }

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")

    if (!token || !storedUser) {
      router.replace("/login")
      return
    }

    try {
      const parsed = JSON.parse(storedUser)
      if (parsed.role !== "ADMIN") {
        router.replace("/dashboard")
        return
      }
      setCurrentAdminId(parsed.id)
    } catch {
      router.replace("/login")
      return
    }

    fetchUsers()
  }, [router])

  // Open Edit Modal
  const handleOpenEditModal = (user: User) => {
    setEditingUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditRole(user.role)
    setEditPassword("")
    setEditError("")
  }

  // Submit User Update
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setEditError("")

    if (!editName.trim() || !editEmail.trim()) {
      setEditError("Name and Email are required.")
      return
    }

    if (editPassword && editPassword.length < 6) {
      setEditError("Password must be at least 6 characters long.")
      return
    }

    setEditSubmitting(true)

    const payload: Record<string, any> = {
      name: editName.trim(),
      email: editEmail.trim(),
      role: editRole,
    }

    if (editPassword) {
      payload.password = editPassword
    }

    const res = await api.put(`/api/users/${editingUser.id}`, payload)
    setEditSubmitting(false)

    if (res.success) {
      setEditingUser(null)
      fetchUsers()
    } else {
      setEditError(res.error || "Failed to update user.")
    }
  }

  // Handle User Deletion
  const handleDeleteUser = async (user: User) => {
    if (user.id === currentAdminId) {
      alert("Action Denied: You cannot delete your own active administrator account.")
      return
    }

    if (
      !confirm(
        `Are you sure you want to delete ${user.name} (${user.email})? This action cannot be undone.`
      )
    ) {
      return
    }

    setDeletingId(user.id)
    const res = await api.delete(`/api/users/${user.id}`)
    setDeletingId(null)

    if (res.success) {
      fetchUsers()
    } else {
      alert(`Delete failed: ${res.error}`)
    }
  }

  // Filtered List
  const filteredUsers = users.filter((u) => {
    const query = searchTerm.toLowerCase()
    const matchesQuery =
      u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter

    return matchesQuery && matchesRole
  })

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Header Bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500">
              View registered employees, assign system privileges, and manage accounts
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search users by name or email address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 pl-11 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none bg-white"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">USER (Lab Member)</option>
              <option value="ADMIN">ADMIN (System Admin)</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        {loading ? (
          <div className="flex h-48 items-center justify-center text-gray-500">
            <Loader2 className="animate-spin mr-2" size={24} /> Loading system users...
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-600 border-b">
                  <tr>
                    <th className="px-6 py-3.5">User Details</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Role / Authority</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === currentAdminId
                    return (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-full font-bold text-xs ${
                                u.role === "ADMIN"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 flex items-center gap-2">
                                {u.name}
                                {isSelf && (
                                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-200">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400">ID: {u.id.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Mail size={14} className="text-gray-400" />
                            {u.email}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                              u.role === "ADMIN"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {u.role === "ADMIN" ? (
                              <>
                                <ShieldCheck size={13} className="text-blue-600" /> System Admin
                              </>
                            ) : (
                              <>
                                <UserIcon size={13} className="text-gray-500" /> Lab Member
                              </>
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition"
                              title="Edit User Details"
                            >
                              <Edit2 size={16} />
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={deletingId === u.id || isSelf}
                              className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 transition"
                              title={isSelf ? "Cannot delete self" : "Delete User"}
                            >
                              {deletingId === u.id ? (
                                <Loader2 className="animate-spin text-red-600" size={16} />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        No users found matching your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Edit User Account</h2>
                  <p className="text-xs text-gray-500">Modify credentials & roles for {editingUser.name}</p>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              {editError && (
                <div className="mt-4 rounded-md bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                  {editError}
                </div>
              )}

              <form onSubmit={handleUpdateUser} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 tracking-wider">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 tracking-wider">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 tracking-wider">
                    Role Authority *
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as "USER" | "ADMIN")}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="USER">USER (Lab Member)</option>
                    <option value="ADMIN">ADMIN (System Administrator)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 tracking-wider">
                    Override Password (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep unchanged"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="w-1/2 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="flex w-1/2 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {editSubmitting && <Loader2 className="animate-spin" size={16} />}
                    Save Changes
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