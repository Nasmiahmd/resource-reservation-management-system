// src/services/resourceService.ts
import { api, ApiResponse } from "@/lib/apiClient"

export interface Resource {
  id: string
  name: string
  description?: string | null
  location: string
  capacity: number
  imageUrl?: string | null
  categoryId: string
  category?: {
    id: string
    name: string
    description?: string | null
    imageUrl?: string | null
  }
  createdAt?: string
  updatedAt?: string
}

export interface CreateResourceInput {
  name: string
  description?: string
  location: string
  capacity: number
  categoryId: string
  imageUrl?: string
}

export interface UpdateResourceInput {
  name?: string
  description?: string
  location?: string
  capacity?: number
  categoryId?: string
  imageUrl?: string
}

export const resourceService = {
  getAll: (): Promise<ApiResponse<Resource[]>> => {
    return api.get<Resource[]>("/api/resources")
  },
  getById: (id: string): Promise<ApiResponse<Resource>> => {
    return api.get<Resource>(`/api/resources/${id}`)
  },
  create: (data: CreateResourceInput): Promise<ApiResponse<Resource>> => {
    return api.post<Resource>("/api/resources", data)
  },
  update: (id: string, data: UpdateResourceInput): Promise<ApiResponse<Resource>> => {
    return api.put<Resource>(`/api/resources/${id}`, data)
  },
  delete: (id: string): Promise<ApiResponse<{ id: string }>> => {
    return api.delete<{ id: string }>(`/api/resources/${id}`)
  },
}