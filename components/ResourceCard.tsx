"use client"

import { Resource } from "@/services/resourceService"
import { MapPin, Users, Layers, Calendar, Edit2, Trash2 } from "lucide-react"

interface ResourceCardProps {
  resource: Resource
  isAdmin?: boolean
  onBook?: (resource: Resource) => void
  onEdit?: (resource: Resource) => void
  onDelete?: (resource: Resource) => void
}

export default function ResourceCard({
  resource,
  isAdmin = false,
  onBook,
  onEdit,
  onDelete,
}: ResourceCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
      <div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
            <Layers size={12} />
            {resource.category?.name || "General"}
          </span>

          {isAdmin && (
            <div className="flex gap-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(resource)}
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition"
                  title="Edit Resource"
                >
                  <Edit2 size={16} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(resource)}
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600 transition"
                  title="Delete Resource"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        <h3 className="mt-3 text-lg font-bold text-gray-900">{resource.name}</h3>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2 min-h-10">
          {resource.description || "No description provided."}
        </p>
      </div>

      <div>
        <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs font-medium text-gray-600">
          <span className="flex items-center gap-1">
            <MapPin size={14} className="text-gray-400" />
            {resource.location}
          </span>
          <span className="flex items-center gap-1">
            <Users size={14} className="text-gray-400" />
            {resource.capacity} Capacity
          </span>
        </div>

        {!isAdmin && onBook && (
          <button
            onClick={() => onBook(resource)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            <Calendar size={16} /> Book Slot
          </button>
        )}
      </div>
    </div>
  )
}