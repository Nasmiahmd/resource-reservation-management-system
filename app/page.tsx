"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  Calendar,
  ShieldCheck,
  Cpu,
  UserPlus,
  Sparkles,
  Layers,
} from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("token")
    if (token) {
      router.push("/dashboard")
    }
  }, [router])

  if (!mounted) return null

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-900 text-white font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -z-10 h-125 w-200 -translate-x-1/2 rounded-full bg-linear-to-tr from-blue-600/20 via-indigo-500/10 to-purple-500/0 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between p-6">
        <div className="flex items-center gap-2 text-xl font-black tracking-wider">
          <div className="rounded-lg bg-blue-600 p-1.5 text-white">
            <Cpu size={20} />
          </div>
          <span>
            Britto <span className="text-blue-500">LAB</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-slate-700/80 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 shadow-md transition"
          >
            <UserPlus size={16} /> Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 border border-blue-500/20 shadow-sm">
          <Sparkles size={14} className="text-blue-400" />
          Internal Resource Reservation Platform
        </div>

        <h1 className="max-w-4xl text-4xl font-black sm:text-6xl tracking-tight leading-tight">
          Reserve Lab Gear & Workspaces{" "}
          <span className="bg-linear-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Effortlessly
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-base text-slate-400 sm:text-lg leading-relaxed">
          Streamlined, conflict-free scheduling for Britto Lab hardware, oscilloscopes, testing equipment, and dedicated meeting rooms.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/register"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition"
          >
            Create Account <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-slate-800/80 px-7 py-3.5 text-sm font-semibold text-slate-200 border border-slate-700 hover:bg-slate-700/80 hover:text-white transition"
          >
            Sign In to Portal
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-5xl text-left">
          <div className="rounded-2xl bg-slate-800/40 p-6 border border-slate-700/60 backdrop-blur-sm hover:border-slate-600 transition">
            <div className="mb-4 inline-block rounded-lg bg-blue-500/10 p-3 text-blue-400">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-bold text-slate-100 text-lg">Secure SSO & RBAC</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Role-based access control (User vs Admin) with integrated Google Workspace and JWT token authentication.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-800/40 p-6 border border-slate-700/60 backdrop-blur-sm hover:border-slate-600 transition">
            <div className="mb-4 inline-block rounded-lg bg-blue-500/10 p-3 text-blue-400">
              <Calendar size={24} />
            </div>
            <h3 className="font-bold text-slate-100 text-lg">Conflict-Free Schedule</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Real-time booking validation prevents overlapping hardware reservations across departments.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-800/40 p-6 border border-slate-700/60 backdrop-blur-sm hover:border-slate-600 transition">
            <div className="mb-4 inline-block rounded-lg bg-blue-500/10 p-3 text-blue-400">
              <Layers size={24} />
            </div>
            <h3 className="font-bold text-slate-100 text-lg">Full Resource Inventory</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Instant access to category filtering, physical locations, capacity limits, and real-time status.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-800/80">
        © 2026 Britto Lab. All Rights Reserved.
      </footer>
    </div>
  )
}