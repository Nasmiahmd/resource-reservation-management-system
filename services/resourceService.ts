import { api, ApiResponse } from "@/lib/apiClient"

export interface Resource {
  id: string
  name: string
  description?: string
  location: string
  capacity: number
  categoryId: string
  category?: { id: string; name: string }
  createdAt?: string
  updatedAt?: string
}

export interface CreateResourceInput {
  name: string
  description?: string
  location: string
  capacity: number
  categoryId: string
}

export interface UpdateResourceInput {
  name?: string
  description?: string
  location?: string
  capacity?: number
  categoryId?: string
}

export const resourceService = {
  // READ (All - with optional category filter)
  getAll: (categoryId?: string): Promise<ApiResponse<Resource[]>> => {
    const query = categoryId ? `?categoryId=${categoryId}` : ""
    return api.get<Resource[]>(`/api/resources${query}`)
  },

  // READ (Single)
  getById: (id: string): Promise<ApiResponse<Resource>> => {
    return api.get<Resource>(`/api/resources/${id}`)
  },

  // CREATE (Admin)
  create: (data: CreateResourceInput): Promise<ApiResponse<Resource>> => {
    return api.post<Resource>("/api/resources", data)
  },

  // UPDATE (Admin)
  update: (id: string, data: UpdateResourceInput): Promise<ApiResponse<Resource>> => {
    return api.put<Resource>(`/api/resources/${id}`, data)
  },

  // DELETE (Admin)
  delete: (id: string): Promise<ApiResponse<{ id: string }>> => {
    return api.delete<{ id: string }>(`/api/resources/${id}`)
  },
}