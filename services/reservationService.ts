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
  userId?: string // Optional if admin creating on behalf of a user
  startTime: string
  endTime: string
}

export interface ReservationFilterInput {
  resourceId?: string
  status?: string
}

export interface UpdateReservationInput {
  startTime?: string
  endTime?: string
  resourceId?: string
}

export const reservationService = {
  // READ (Current logged in user)
  getMine: (): Promise<ApiResponse<Reservation[]>> => {
    return api.get<Reservation[]>("/api/reservations/me")
  },

  // READ (All system reservations - Admin)
  getAll: (filters?: ReservationFilterInput): Promise<ApiResponse<Reservation[]>> => {
    const params = new URLSearchParams()
    if (filters?.resourceId) params.append("resourceId", filters.resourceId)
    if (filters?.status) params.append("status", filters.status)

    const queryString = params.toString() ? `?${params.toString()}` : ""
    return api.get<Reservation[]>(`/api/reservations${queryString}`)
  },

  // READ (Single)
  getById: (id: string): Promise<ApiResponse<Reservation>> => {
    return api.get<Reservation>(`/api/reservations/${id}`)
  },

  // CREATE
  create: (data: CreateReservationInput): Promise<ApiResponse<Reservation>> => {
    return api.post<Reservation>("/api/reservations", data)
  },

  // CANCEL / DELETE
  cancel: (id: string): Promise<ApiResponse<{ id: string }>> => {
    return api.delete<{ id: string }>(`/api/reservations/${id}`)
  },

  // UPDATE (User/Admin)
  update: (id: string, data: UpdateReservationInput): Promise<ApiResponse<Reservation>> => {
    return api.put<Reservation>(`/api/reservations/${id}`, data)
  },
}