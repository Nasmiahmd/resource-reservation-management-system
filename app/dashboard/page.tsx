"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import ResourceCard from "@/components/ResourceCard"
import { resourceService, Resource } from "@/services/resourceService"
import { categoryService, Category } from "@/services/categoryService"
import { reservationService } from "@/services/reservationService"
import {
  Search,
  Filter,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  CalendarDays,
} from "lucide-react"

interface ExistingBooking {
  id: string
  resourceId: string
  startTime: string
  endTime: string
  status?: string
}

export default function UserDashboard() {
  const router = useRouter()
  const [resources, setResources] = useState<Resource[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")

  // Booking Modal
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState("")
  const [bookingSuccess, setBookingSuccess] = useState("")

  const loadData = async () => {
    setLoading(true)
    setError(null)

    const [resData, catData] = await Promise.all([
      resourceService.getAll(),
      categoryService.getAll(),
    ])

    if (resData.success && resData.data) {
      setResources(resData.data)
    } else {
      setError(resData.error || "Failed to load resources")
    }

    if (catData.success && catData.data) {
      setCategories(catData.data)
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
    loadData()
  }, [router])

  // Fetch active bookings specifically for the selected resource when opening the modal
  const handleOpenBookingModal = async (resource: Resource) => {
    setSelectedResource(resource)
    setStartTime("")
    setEndTime("")
    setBookingError("")
    setBookingSuccess("")
    setExistingBookings([])
    setLoadingBookings(true)

    // Pass resourceId explicitly so backend returns all booked slots for this resource
    const res = await reservationService.getAll({ resourceId: resource.id })
    if (res.success && res.data) {
      const activeBookings = res.data.filter(
        (b: ExistingBooking) =>
          new Date(b.endTime) > new Date() &&
          b.status !== "CANCELLED"
      )
      setExistingBookings(activeBookings)
    }

    setLoadingBookings(false)
  }

  // Real-time slot conflict checker
  const hasConflict = () => {
    if (!startTime || !endTime) return false
    const start = new Date(startTime)
    const end = new Date(endTime)
    if (start >= end) return false

    return existingBookings.some((b) => {
      const bStart = new Date(b.startTime)
      const bEnd = new Date(b.endTime)
      // Overlap condition: startA < endB AND endA > startB
      return start < bEnd && end > bStart
    })
  }

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingError("")
    setBookingSuccess("")

    if (!startTime || !endTime) {
      setBookingError("Please select both start and end times")
      return
    }

    if (new Date(startTime) >= new Date(endTime)) {
      setBookingError("End time must be after start time")
      return
    }

    if (new Date(startTime) < new Date()) {
      setBookingError("Start time cannot be in the past")
      return
    }

    if (hasConflict()) {
      setBookingError("The selected time slot conflicts with an existing reservation.")
      return
    }

    setBookingSubmitting(true)

    const res = await reservationService.create({
      resourceId: selectedResource!.id,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
    })

    setBookingSubmitting(false)

    if (res.success) {
      setBookingSuccess("Reservation confirmed successfully!")
      setTimeout(() => {
        setSelectedResource(null)
      }, 1500)
    } else {
      setBookingError(res.error || "Failed to complete reservation")
    }
  }

  const filteredResources = resources.filter((item) => {
    const query = searchTerm.toLowerCase()
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)

    const matchesCategory = selectedCategory
      ? item.categoryId === selectedCategory
      : true

    return matchesSearch && matchesCategory
  })

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Banner */}
        <div className="mb-8 rounded-2xl bg-linear-to-r from-blue-700 to-indigo-800 p-8 text-white shadow-md">
          <h1 className="text-3xl font-extrabold">Reserve Lab Equipment & Workspaces</h1>
          <p className="mt-2 text-sm text-blue-100 max-w-xl">
            Select an available resource, choose your required timeframe, and submit your reservation request instantly.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Filter Controls */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by equipment name, location, or spec..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 pl-11 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-2 sm:w-64">
            <Filter size={18} className="text-gray-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none bg-white text-gray-900"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="flex h-48 items-center justify-center text-gray-500">
            <Loader2 className="animate-spin mr-2" size={24} /> Loading available resources...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((item) => (
              <ResourceCard
                key={item.id}
                resource={item}
                onBook={handleOpenBookingModal}
              />
            ))}

            {filteredResources.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
                No matching resources found.
              </div>
            )}
          </div>
        )}

        {/* Booking Modal */}
        {selectedResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Book {selectedResource.name}</h2>
                  <p className="text-xs text-gray-500">{selectedResource.location}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedResource(null)}
                  className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Reserved Slots Display */}
              <div className="mt-4 rounded-lg bg-amber-50 p-3.5 border border-amber-200">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 mb-2">
                  <Clock size={14} />
                  <span>Already Reserved Slots</span>
                </div>

                {loadingBookings ? (
                  <div className="flex items-center gap-2 text-xs text-amber-700">
                    <Loader2 className="animate-spin" size={13} /> Checking schedule...
                  </div>
                ) : existingBookings.length === 0 ? (
                  <p className="text-xs text-amber-700 font-medium">
                    No upcoming reservations. All time slots are currently available!
                  </p>
                ) : (
                  <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {existingBookings.map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center justify-between bg-amber-100/70 px-2.5 py-1.5 rounded text-xs font-medium text-amber-900"
                      >
                        <span className="flex items-center gap-1">
                          <CalendarDays size={12} className="text-amber-700 shrink-0" />
                          {new Date(b.startTime).toLocaleDateString()}{" "}
                          <span className="font-semibold text-amber-950 ml-0.2">
                            {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {" → "}{new Date(b.endTime).toLocaleDateString()}{" "}
                          <span className="font-semibold text-amber-950">
                            {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </span>
                        <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[10px] uppercase tracking-wide font-bold text-amber-800">
                          Booked
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Error and Success Banners */}
              {bookingError && (
                <div className="mt-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                  <AlertCircle size={16} className="shrink-0" /> {bookingError}
                </div>
              )}

              {bookingSuccess && (
                <div className="mt-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-xs text-green-700 border border-green-200">
                  <CheckCircle2 size={16} className="shrink-0" /> {bookingSuccess}
                </div>
              )}

              {/* Dynamic Conflict Warning */}
              {hasConflict() && !bookingError && (
                <div className="mt-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                  <AlertCircle size={16} className="shrink-0" />
                  This time slot conflicts with an existing reservation above.
                </div>
              )}

              <form onSubmit={handleCreateBooking} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none scheme-light"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none scheme-light"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setSelectedResource(null)}
                    className="w-1/2 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingSubmitting || hasConflict()}
                    className="flex w-1/2 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {bookingSubmitting && <Loader2 className="animate-spin" size={16} />}
                    Confirm
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