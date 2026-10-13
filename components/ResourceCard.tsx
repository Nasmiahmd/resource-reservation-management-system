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
  const displayImage = resource.imageUrl || resource.category?.imageUrl

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
      <div>
        <div className="relative h-40 w-full overflow-hidden bg-slate-100 border-b border-gray-100">
          {displayImage ? (
            <img
              src={displayImage}
              alt={resource.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-linear-to-br from-slate-800 to-slate-900 text-slate-400">
              <Layers size={36} className="text-blue-500/80 mb-1" />
              <span className="text-[11px] font-medium tracking-wider uppercase text-slate-400">
                {resource.category?.name || "General Resource"}
              </span>
            </div>
          )}

          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
              <Layers size={12} className="text-blue-400" />
              {resource.category?.name || "General"}
            </span>
          </div>

          {isAdmin && (
            <div className="absolute top-3 right-3 flex gap-1.5 rounded-lg bg-black/60 p-1 backdrop-blur-md">
              {onEdit && (
                <button
                  onClick={() => onEdit(resource)}
                  className="rounded p-1 text-white hover:bg-white/20 transition"
                  title="Edit Resource"
                >
                  <Edit2 size={15} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(resource)}
                  className="rounded p-1 text-red-400 hover:bg-white/20 transition"
                  title="Delete Resource"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900">{resource.name}</h3>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2 min-h-10">
            {resource.description || "No description provided."}
          </p>
        </div>
      </div>

      <div className="p-5 pt-0">
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-600">
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