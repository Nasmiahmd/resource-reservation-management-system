import { api, ApiResponse } from "@/lib/apiClient"

export interface Category {
  id: string
  name: string
  description?: string | null
  createdAt?: string
  updatedAt?: string
  resources?: any[]
  _count?: {
    resources?: number
  }
}

export interface CreateCategoryInput {
  name: string
  description?: string
}

export interface UpdateCategoryInput {
  name?: string
  description?: string
}

export const categoryService = {
  // READ (All)
  getAll: (): Promise<ApiResponse<Category[]>> => {
    return api.get<Category[]>("/api/categories")
  },

  // CREATE (Admin)
  create: (data: CreateCategoryInput): Promise<ApiResponse<Category>> => {
    return api.post<Category>("/api/categories", data)
  },

  // UPDATE (Admin)
  update: (id: string, data: UpdateCategoryInput): Promise<ApiResponse<Category>> => {
    return api.put<Category>(`/api/categories/${id}`, data)
  },

  // DELETE (Admin)
  delete: (id: string): Promise<ApiResponse<{ id: string }>> => {
    return api.delete<{ id: string }>(`/api/categories/${id}`)
  },
}