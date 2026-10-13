"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import ResourceCard from "@/components/ResourceCard"
import { resourceService, Resource } from "@/services/resourceService"
import { categoryService, Category } from "@/services/categoryService"
import {
  Plus,
  Search,
  Filter,
  X,
  Loader2,
  AlertCircle,
  Upload,
} from "lucide-react"

export default function ResourceManager() {
  const router = useRouter()
  const [resources, setResources] = useState<Resource[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("")

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)

  // Form State
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [capacity, setCapacity] = useState<number>(1)
  const [categoryId, setCategoryId] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  const fetchData = async () => {
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
    fetchData()
  }, [router])

  // Direct Cloudinary Upload Helper
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset"

    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", uploadPreset)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || "Cloudinary upload failed")
    return data.secure_url
  }

  const handleOpenCreateModal = () => {
    setEditingResource(null)
    setName("")
    setDescription("")
    setLocation("")
    setCapacity(1)
    setCategoryId(categories[0]?.id || "")
    setImageUrl("")
    setImageFile(null)
    setImagePreview("")
    setFormError("")
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (resource: Resource) => {
    setEditingResource(resource)
    setName(resource.name)
    setDescription(resource.description || "")
    setLocation(resource.location)
    setCapacity(resource.capacity)
    setCategoryId(resource.categoryId)
    setImageUrl(resource.imageUrl || "")
    setImagePreview(resource.imageUrl || "")
    setImageFile(null)
    setFormError("")
    setIsModalOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setSubmitting(true)

    if (!name.trim() || !location.trim() || !categoryId) {
      setFormError("Name, location, and category are required")
      setSubmitting(false)
      return
    }

    if (capacity <= 0) {
      setFormError("Capacity must be at least 1")
      setSubmitting(false)
      return
    }

    try {
      let finalImageUrl = imageUrl

      if (imageFile) {
        finalImageUrl = await uploadToCloudinary(imageFile)
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        capacity: Number(capacity),
        categoryId,
        imageUrl: finalImageUrl,
      }

      if (editingResource) {
        const res = await resourceService.update(editingResource.id, payload)
        if (res.success && res.data) {
          setResources((prev) =>
            prev.map((item) => (item.id === editingResource.id ? res.data! : item))
          )
          setIsModalOpen(false)
        } else {
          setFormError(res.error || "Failed to update resource")
        }
      } else {
        const res = await resourceService.create(payload)
        if (res.success && res.data) {
          setResources((prev) => [...prev, res.data!])
          setIsModalOpen(false)
        } else {
          setFormError(res.error || "Failed to create resource")
        }
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to upload image to Cloudinary")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (resource: Resource) => {
    if (!confirm(`Are you sure you want to delete "${resource.name}"?`)) return

    const res = await resourceService.delete(resource.id)
    if (res.success) {
      setResources((prev) => prev.filter((item) => item.id !== resource.id))
    } else {
      alert(`Error deleting resource: ${res.error}`)
    }
  }

  const filteredResources = resources.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategoryFilter
      ? item.categoryId === selectedCategoryFilter
      : true

    return matchesSearch && matchesCategory
  })

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lab Resources</h1>
            <p className="text-sm text-gray-500">
              Manage equipment, testing rigs, and workspaces across PrimeWave Lab
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus size={18} /> Add Resource
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search resources by name, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 sm:w-64">
            <Filter size={18} className="text-gray-400" />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
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

        {loading ? (
          <div className="flex h-48 items-center justify-center text-gray-500">
            <Loader2 className="animate-spin mr-2" size={24} /> Loading resources...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((item) => (
              <ResourceCard
                key={item.id}
                resource={item}
                isAdmin
                onEdit={handleOpenEditModal}
                onDelete={handleDelete}
              />
            ))}

            {filteredResources.length === 0 && !loading && (
              <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
                No resources found matching your criteria.
              </div>
            )}
          </div>
        )}

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingResource ? "Edit Resource" : "Create New Resource"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              {formError && (
                <div className="mt-4 rounded-md bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {/* Image Upload Control */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 tracking-wider">
                    Resource Image
                  </label>
                  <div className="mt-1.5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-4 hover:border-blue-500 transition relative bg-gray-50">
                    {imagePreview ? (
                      <div className="relative h-32 w-full overflow-hidden rounded-lg">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null)
                            setImageUrl("")
                            setImagePreview("")
                          }}
                          className="absolute top-2 right-2 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer text-center">
                        <Upload size={24} className="text-gray-400 mb-1" />
                        <span className="text-xs font-semibold text-blue-600">Upload Equipment Image</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WebP up to 5MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Resource Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., High-Freq Oscilloscope Lab 2"
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Category *
                    </label>
                    <select
                      required
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="" disabled>Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Capacity / Seats *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Location / Room *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Building B - Room 304"
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Specifications, guidelines, or access instructions..."
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/2 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-1/2 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {submitting && <Loader2 className="animate-spin" size={16} />}
                    {editingResource ? "Update" : "Create"}
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