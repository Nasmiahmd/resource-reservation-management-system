"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import GoogleAuthButton from "@/components/GoogleAuthButton"

export default function RegisterPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Form State
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // UI State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("token")
    if (token) {
      router.replace("/dashboard")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all required fields.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || "Registration failed. Please try again.")
        setLoading(false)
        return
      }

      if (data.token && data.user) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        router.push("/dashboard")
      } else {
        router.push("/login?registered=true")
      }
    } catch (err) {
      console.error("Register error:", err)
      setError("A network error occurred. Please check your connection.")
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 text-white">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-slate-800/80 p-8 shadow-2xl border border-slate-700/50 backdrop-blur-sm">
        
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-block text-2xl font-black tracking-wider text-white">
            Britto <span className="text-blue-500">LAB</span>
          </Link>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-100">
            Create your account
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Join the internal resource reservation platform
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <div className="pt-2">
          <GoogleAuthButton onError={(err) => setError(err)} />
        </div>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/80" />
          </div>
          <span className="relative bg-slate-800/90 px-3 text-xs font-semibold uppercase text-slate-400">
            Or register with email
          </span>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Full Name
            </label>
            <div className="relative mt-1.5">
              <User size={18} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                required
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Email Address
            </label>
            <div className="relative mt-1.5">
              <Mail size={18} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                required
                placeholder="alex@Brittolab.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock size={18} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Confirm Password
            </label>
            <div className="relative mt-1.5">
              <Lock size={18} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Creating Account...
              </>
            ) : (
              <>
                Register Account <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300 hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  )
}