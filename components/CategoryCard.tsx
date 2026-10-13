"use client"

import { Category } from "@/services/categoryService"
import { Folder, Edit2, Trash2, Layers, Image as ImageIcon } from "lucide-react"

interface CategoryCardProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (id: string, name: string) => void
}

export default function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const resourceCount = category._count?.resources ?? category.resources?.length ?? 0

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
      <div>
        {/* Cloudinary Image Header / Fallback */}
        <div className="relative h-40 w-full overflow-hidden bg-slate-100 border-b border-gray-100">
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-linear-to-br from-slate-800 to-slate-900 text-slate-400">
              <Folder size={36} className="text-blue-500/80 mb-1" />
              <span className="text-[11px] font-medium tracking-wider uppercase text-slate-400">
                No Preview Image
              </span>
            </div>
          )}

          {/* Action Overlay Buttons */}
          <div className="absolute top-3 right-3 flex gap-1.5 rounded-lg bg-black/60 p-1 backdrop-blur-md">
            <button
              onClick={() => onEdit(category)}
              className="rounded p-1 text-white hover:bg-white/20 transition"
              title="Edit Category"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => onDelete(category.id, category.name)}
              className="rounded p-1 text-red-400 hover:bg-white/20 transition"
              title="Delete Category"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Card Details */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2 min-h-10">
            {category.description || "No category description specified."}
          </p>
        </div>
      </div>

      <div className="mx-5 mb-5 flex items-center gap-1.5 border-t border-gray-100 pt-3 text-xs font-semibold text-gray-600">
        <Layers size={14} className="text-blue-600" />
        <span>
          {resourceCount} Linked {resourceCount === 1 ? "Resource" : "Resources"}
        </span>
      </div>
    </div>
  )
}