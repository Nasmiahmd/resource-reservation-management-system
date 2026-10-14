"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { reservationService, Reservation } from "@/services/reservationService"
import {
  Calendar,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  X,
  ArrowRight,
} from "lucide-react"

// Helper to convert ISO date string to YYYY-MM-DDTHH:mm for datetime-local inputs
const formatForDateTimeInput = (isoString: string) => {
  if (!isoString) return ""
  const date = new Date(isoString)
  const tzOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}

export default function MyReservations() {
  const router = useRouter()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Edit Modal State
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [editStartTime, setEditStartTime] = useState("")
  const [editEndTime, setEditEndTime] = useState("")
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState("")

  const fetchMyReservations = async () => {
    setLoading(true)
    setError(null)
    const res = await reservationService.getMine()
    if (res.success && res.data) {
      setReservations(res.data)
    } else {
      setError(res.error || "Failed to load your reservations")
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
    fetchMyReservations()
  }, [router])

  // Open Edit Modal
  const handleOpenEditModal = (item: Reservation) => {
    setEditingReservation(item)
    setEditStartTime(formatForDateTimeInput(item.startTime))
    setEditEndTime(formatForDateTimeInput(item.endTime))
    setEditError("")
  }

  // Handle Update Submit
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReservation) return

    setEditError("")

    if (!editStartTime || !editEndTime) {
      setEditError("Please select both start and end times.")
      return
    }

    if (new Date(editStartTime) >= new Date(editEndTime)) {
      setEditError("End time must be after start time.")
      return
    }

    if (new Date(editStartTime) < new Date()) {
      setEditError("Start time cannot be in the past.")
      return
    }

    setEditSubmitting(true)

    const res = await reservationService.update(editingReservation.id, {
      startTime: new Date(editStartTime).toISOString(),
      endTime: new Date(editEndTime).toISOString(),
    })

    setEditSubmitting(false)

    if (res.success) {
      setEditingReservation(null)
      fetchMyReservations()
    } else {
      setEditError(res.error || "Failed to update reservation.")
    }
  }

  // Handle Cancel
  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return

    setCancellingId(id)
    const res = await reservationService.cancel(id)
    setCancellingId(null)

    if (res.success) {
      fetchMyReservations()
    } else {
      alert(`Failed to cancel reservation: ${res.error}`)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-sm text-gray-500">
            View, modify, or cancel your upcoming lab reservations
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-48 items-center justify-center text-gray-500">
            <Loader2 className="animate-spin mr-2" size={24} /> Loading your bookings...
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600 shrink-0">
                    <Calendar size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {item.resource?.name || "Resource"}
                    </h3>
                    <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <MapPin size={12} /> {item.resource?.location || "N/A"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-gray-700">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(item.startTime).toLocaleDateString()}
                        {" "}
                        {new Date(item.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center"><ArrowRight size={12}/></span>
                      <span className="flex items-center gap-1">
                        {new Date(item.endTime).toLocaleDateString()}
                        {" "}
                        {new Date(item.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-3 sm:border-t-0 sm:pt-0 sm:justify-end gap-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === "CONFIRMED"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.status === "CONFIRMED" ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <XCircle size={12} />
                    )}
                    {item.status}
                  </span>

                  {item.status === "CONFIRMED" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700! hover:bg-gray-100 transition"
                      >
                        <Edit2 size={14} /> Edit
                      </button>

                      <button
                        onClick={() => handleCancel(item.id)}
                        disabled={cancellingId === item.id}
                        className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600! hover:bg-red-50 disabled:opacity-50 transition"
                      >
                        {cancellingId === item.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {reservations.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
                You have no active or previous reservations.
              </div>
            )}
          </div>
        )}

        {/* Edit Reservation Modal */}
        {editingReservation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Modify Reservation
                  </h2>
                  <p className="text-xs text-gray-500">
                    {editingReservation.resource?.name}
                  </p>
                </div>
                <button
                  onClick={() => setEditingReservation(null)}
                  className="rounded-lg p-1 text-gray-600! hover:bg-gray-100 hover:text-gray-900!"
                >
                  <X size={20} />
                </button>
              </div>

              {editError && (
                <div className="mt-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                  <AlertCircle size={16} /> {editError}
                </div>
              )}

              <form onSubmit={handleUpdate} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
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

                <div className="flex items-center gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingReservation(null)}
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
                    Update Booking
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