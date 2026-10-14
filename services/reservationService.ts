import { api, ApiResponse } from "@/lib/apiClient"

export interface Reservation {
  id: string
  resourceId: string
  userId: string
  startTime: string
  endTime: string
  status: "CONFIRMED" | "CANCELLED"
  resource?: { id: string; name: string; location: string }
  user?: { id: string; name: string; email: string }
  createdAt?: string
  updatedAt?: string
}

export interface CreateReservationInput {
  resourceId: string
  userId?: string // Optional: used by Admins creating a reservation for another user
  startTime: string
  endTime: string
}

export interface ReservationFilterInput {
  resourceId?: string
  userId?: string
  status?: string
}

export interface UpdateReservationInput {
  startTime?: string
  endTime?: string
  resourceId?: string
  status?: "CONFIRMED" | "CANCELLED"
}

export const reservationService = {
  // READ (Fetch reservations with optional filters - for Admin view or slot checking)
  getAll: (filters?: ReservationFilterInput): Promise<ApiResponse<Reservation[]>> => {
    const params = new URLSearchParams()
    if (filters?.resourceId) params.append("resourceId", filters.resourceId)
    if (filters?.userId) params.append("userId", filters.userId)
    if (filters?.status) params.append("status", filters.status)

    const queryString = params.toString() ? `?${params.toString()}` : ""
    return api.get<Reservation[]>(`/api/reservations${queryString}`)
  },

  // READ (Fetch current user's personal reservations only)
  getMine: (): Promise<ApiResponse<Reservation[]>> => {
    return api.get<Reservation[]>("/api/reservations?mine=true")
  },

  // READ (Single reservation details)
  getById: (id: string): Promise<ApiResponse<Reservation>> => {
    return api.get<Reservation>(`/api/reservations/${id}`)
  },

  // CREATE (Create a new reservation)
  create: (data: CreateReservationInput): Promise<ApiResponse<Reservation>> => {
    return api.post<Reservation>("/api/reservations", data)
  },

  // UPDATE (Update times, resource, or status via PUT)
  update: (id: string, data: UpdateReservationInput): Promise<ApiResponse<Reservation>> => {
    return api.put<Reservation>(`/api/reservations/${id}`, data)
  },

  // CANCEL (Soft cancel: update status to "CANCELLED" via PATCH)
  cancel: (id: string): Promise<ApiResponse<Reservation>> => {
    return api.patch<Reservation>(`/api/reservations/${id}`, { status: "CANCELLED" })
  },

  // DELETE (Hard delete reservation record from database)
  delete: (id: string): Promise<ApiResponse<{ id: string }>> => {
    return api.delete<{ id: string }>(`/api/reservations/${id}`)
  },
}