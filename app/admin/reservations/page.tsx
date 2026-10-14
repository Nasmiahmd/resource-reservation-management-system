"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { reservationService, Reservation } from "@/services/reservationService"
import { resourceService, Resource } from "@/services/resourceService"
import {
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  User,
  MapPin,
  Search,
  Filter,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react"

// Helper to convert ISO date string to YYYY-MM-DDTHH:mm for datetime-local inputs
const formatForDateTimeInput = (isoString: string) => {
  if (!isoString) return ""
  const date = new Date(isoString)
  const tzOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}

export default function AdminReservations() {
  const router = useRouter()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [resourceFilter, setResourceFilter] = useState("")

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createResourceId, setCreateResourceId] = useState("")
  const [createStartTime, setCreateStartTime] = useState("")
  const [createEndTime, setCreateEndTime] = useState("")
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createFormError, setCreateFormError] = useState("")

  // Edit Modal State
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [editResourceId, setEditResourceId] = useState("")
  const [editStartTime, setEditStartTime] = useState("")
  const [editEndTime, setEditEndTime] = useState("")
  const [editStatus, setEditStatus] = useState<"CONFIRMED" | "CANCELLED">("CONFIRMED")
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editFormError, setEditFormError] = useState("")

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    const [resData, resourcesData] = await Promise.all([
      reservationService.getAll(),
      resourceService.getAll(),
    ])

    if (resData.success && resData.data) {
      setReservations(resData.data)
    } else {
      setError(resData.error || "Failed to load reservations")
    }

    if (resourcesData.success && resourcesData.data) {
      setResources(resourcesData.data)
    }

    setLoading(false)
  }

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("token")
    if (!token) {
      router.replace("/login")
      return
    }
    fetchData()
  }, [router])

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setCreateResourceId(resources[0]?.id || "")
    setCreateStartTime("")
    setCreateEndTime("")
    setCreateFormError("")
    setIsCreateModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEditModal = (res: Reservation) => {
    setEditingReservation(res)
    setEditResourceId(res.resourceId)
    setEditStartTime(formatForDateTimeInput(res.startTime))
    setEditEndTime(formatForDateTimeInput(res.endTime))
    setEditStatus(res.status)
    setEditFormError("")
  }

  // Handle Create Submit
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateFormError("")
    setCreateSubmitting(true)

    if (!createResourceId || !createStartTime || !createEndTime) {
      setCreateFormError("All fields are required")
      setCreateSubmitting(false)
      return
    }

    if (new Date(createStartTime) >= new Date(createEndTime)) {
      setCreateFormError("End time must be after start time")
      setCreateSubmitting(false)
      return
    }

    const res = await reservationService.create({
      resourceId: createResourceId,
      startTime: new Date(createStartTime).toISOString(),
      endTime: new Date(createEndTime).toISOString(),
    })

    if (res.success) {
      setIsCreateModalOpen(false)
      fetchData()
    } else {
      setCreateFormError(res.error || "Failed to create reservation")
    }
    setCreateSubmitting(false)
  }

  // Handle Edit Submit
  const handleUpdateReservation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReservation) return

    setEditFormError("")
    setEditSubmitting(true)

    if (!editResourceId || !editStartTime || !editEndTime) {
      setEditFormError("All fields are required")
      setEditSubmitting(false)
      return
    }

    if (new Date(editStartTime) >= new Date(editEndTime)) {
      setEditFormError("End time must be after start time")
      setEditSubmitting(false)
      return
    }

    const res = await reservationService.update(editingReservation.id, {
      resourceId: editResourceId,
      startTime: new Date(editStartTime).toISOString(),
      endTime: new Date(editEndTime).toISOString(),
      status: editStatus,
    } as any)

    if (res.success) {
      setEditingReservation(null)
      fetchData()
    } else {
      setEditFormError(res.error || "Failed to update reservation")
    }
    setEditSubmitting(false)
  }

  // Handle Delete / Cancel Quick Button
  const handleCancelReservation = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return

    const res = await reservationService.cancel(id)
    if (res.success) {
      fetchData()
    } else {
      alert(`Error cancelling reservation: ${res.error}`)
    }
  }

  // Filtered Reservations
  const filteredReservations = reservations.filter((res) => {
    const resourceName = res.resource?.name?.toLowerCase() || ""
    const userName = res.user?.name?.toLowerCase() || ""
    const userEmail = res.user?.email?.toLowerCase() || ""
    const query = searchTerm.toLowerCase()

    const matchesSearch =
      resourceName.includes(query) ||
      userName.includes(query) ||
      userEmail.includes(query)

    const matchesStatus =
      statusFilter === "ALL" || res.status === statusFilter

    const matchesResource =
      !resourceFilter || res.resourceId === resourceFilter

    return matchesSearch && matchesStatus && matchesResource
  })

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Header Bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Reservations</h1>
            <p className="text-sm text-gray-500">
              View, modify, and override bookings across Britto Lab
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus size={18} /> Manual Booking
          </button>
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
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by resource, user name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Resources</option>
              {resources.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="flex h-48 items-center justify-center text-gray-500">
            <Loader2 className="animate-spin mr-2" size={24} /> Loading reservations...
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-600 border-b">
                  <tr>
                    <th className="px-6 py-3">Resource</th>
                    <th className="px-6 py-3">Reserved By</th>
                    <th className="px-6 py-3">Schedule</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReservations.map((res) => (
                    <tr key={res.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{res.resource?.name || "Unknown Resource"}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <MapPin size={12} /> {res.resource?.location || "N/A"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-slate-100 p-1.5 text-slate-600">
                            <User size={14} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{res.user?.name || "User"}</div>
                            <div className="text-xs text-gray-500">{res.user?.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-700">
                        <div className="flex items-center gap-1 font-medium">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(res.startTime).toLocaleDateString()}
                          <span className="flex items-center"><ArrowRight size={12}/></span>
                          {new Date(res.endTime).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 mt-1">
                          <Clock size={14} className="text-gray-400" />
                          {new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="flex items-center"><ArrowRight size={12}/></span>
                          {new Date(res.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            res.status === "CONFIRMED"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {res.status === "CONFIRMED" ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {res.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(res)}
                            className="rounded p-1.5 text-gray-600! hover:bg-gray-100 hover:text-blue-600! transition"
                            title="Edit Reservation"
                          >
                            <Edit2 size={16} />
                          </button>

                          {res.status === "CONFIRMED" && (
                            <button
                              onClick={() => handleCancelReservation(res.id)}
                              className="rounded p-1.5 text-gray-600! hover:bg-gray-100 hover:text-red-600! transition"
                              title="Cancel Reservation"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredReservations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No reservations match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Reservation Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-lg font-bold text-gray-900">New Reservation</h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg p-1 text-gray-600! hover:bg-gray-100 hover:text-gray-900!"
                >
                  <X size={20} />
                </button>
              </div>

              {createFormError && (
                <div className="mt-4 rounded-md bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                  {createFormError}
                </div>
              )}

              <form onSubmit={handleCreateReservation} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Target Resource *
                  </label>
                  <select
                    required
                    value={createResourceId}
                    onChange={(e) => setCreateResourceId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {resources.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={createStartTime}
                    onChange={(e) => setCreateStartTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={createEndTime}
                    onChange={(e) => setCreateEndTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="w-1/2 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createSubmitting}
                    className="flex w-1/2 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {createSubmitting && <Loader2 className="animate-spin" size={16} />}
                    Confirm Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Reservation Modal */}
        {editingReservation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Edit Reservation</h2>
                  <p className="text-xs text-gray-500">
                    Booked by {editingReservation.user?.name || "User"}
                  </p>
                </div>
                <button
                  onClick={() => setEditingReservation(null)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              {editFormError && (
                <div className="mt-4 rounded-md bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                  {editFormError}
                </div>
              )}

              <form onSubmit={handleUpdateReservation} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Resource *
                  </label>
                  <select
                    required
                    value={editResourceId}
                    onChange={(e) => setEditResourceId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {resources.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "CONFIRMED" | "CANCELLED")}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingReservation(null)}
                    className="w-1/2 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="flex w-1/2 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
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