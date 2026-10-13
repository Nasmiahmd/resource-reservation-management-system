"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import CategoryCard from "@/components/CategoryCard"
import { categoryService, Category } from "@/services/categoryService"
import { Plus, X, Loader2, AlertCircle, Upload, Image as ImageIcon } from "lucide-react"

export default function CategoryManager() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  const fetchCategories = async () => {
    setLoading(true)
    setError(null)
    const res = await categoryService.getAll()
    if (res.success && res.data) {
      setCategories(res.data)
    } else {
      setError(res.error || "Failed to load categories")
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
    fetchCategories()
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
    if (!res.ok) throw new Error(data.error?.message || "Cloudinary image upload failed")
    return data.secure_url
  }

  const handleOpenCreateModal = () => {
    setEditingCategory(null)
    setName("")
    setDescription("")
    setImageUrl("")
    setImageFile(null)
    setImagePreview("")
    setFormError("")
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category)
    setName(category.name)
    setDescription(category.description || "")
    setImageUrl(category.imageUrl || "")
    setImagePreview(category.imageUrl || "")
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

    if (!name.trim()) {
      setFormError("Category name is required")
      setSubmitting(false)
      return
    }

    try {
      let finalImageUrl = imageUrl

      // Upload file to Cloudinary if user selected a new image
      if (imageFile) {
        finalImageUrl = await uploadToCloudinary(imageFile)
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        imageUrl: finalImageUrl,
      }

      if (editingCategory) {
        const res = await categoryService.update(editingCategory.id, payload)
        if (res.success && res.data) {
          setCategories((prev) =>
            prev.map((cat) => (cat.id === editingCategory.id ? res.data! : cat))
          )
          setIsModalOpen(false)
        } else {
          setFormError(res.error || "Failed to update category")
        }
      } else {
        const res = await categoryService.create(payload)
        if (res.success && res.data) {
          setCategories((prev) => [...prev, res.data!])
          setIsModalOpen(false)
        } else {
          setFormError(res.error || "Failed to create category")
        }
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to upload image to Cloudinary")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"?`)) return

    const res = await categoryService.delete(id)
    if (res.success) {
      setCategories((prev) => prev.filter((cat) => cat.id !== id))
    } else {
      alert(`Error deleting category: ${res.error}`)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resource Categories</h1>
            <p className="text-sm text-gray-500">
              Organize equipment groups with custom media
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus size={18} /> Add Category
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-48 items-center justify-center text-gray-500">
            <Loader2 className="animate-spin mr-2" size={24} /> Loading categories...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onEdit={handleOpenEditModal}
                onDelete={handleDelete}
              />
            ))}

            {categories.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
                No categories created yet. Click "Add Category" to get started.
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingCategory ? "Edit Category" : "New Category"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
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
                {/* Cloudinary Image Input */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 tracking-wider">
                    Category Image
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
                        <span className="text-xs font-semibold text-blue-600">Upload Media</span>
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
                  <label className="block text-xs font-semibold uppercase text-gray-700 tracking-wider">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Oscilloscopes & Rigs"
                    className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 tracking-wider">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of hardware or equipment in this group..."
                    className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/2 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-1/2 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {submitting && <Loader2 className="animate-spin" size={16} />}
                    {editingCategory ? "Update" : "Create"}
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