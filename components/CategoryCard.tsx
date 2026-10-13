"use client"

import { Category } from "@/services/categoryService"
import { Folder, Edit2, Trash2, Layers } from "lucide-react"

interface CategoryCardProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (id: string, name: string) => void
}

export default function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const resourceCount = category._count?.resources ?? category.resources?.length ?? 0

  return (
    <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
      <div>
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
            <Folder size={22} />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(category)}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition"
              title="Edit Category"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => onDelete(category.id, category.name)}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600 transition"
              title="Delete Category"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <h3 className="mt-4 text-lg font-bold text-gray-900">{category.name}</h3>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2 min-h-10">
          {category.description || "No category description specified."}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-1.5 border-t pt-3 text-xs font-semibold text-gray-600">
        <Layers size={14} className="text-gray-400" />
        <span>{resourceCount} Linked {resourceCount === 1 ? "Resource" : "Resources"}</span>
      </div>
    </div>
  )
}