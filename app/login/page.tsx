"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import GoogleAuthButton from "@/components/GoogleAuthButton"

export default function LoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Form State
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  // UI State
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("token")
    if (token) {
      router.replace("/dashboard")
    }
  }, [router])

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim() || !password) {
      setError("Please enter both email and password.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      setLoading(false)

      if (data.success) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        router.push("/dashboard")
      } else {
        setError(data.error || "Login failed. Please check your credentials.")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("A network error occurred. Please try again.")
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
            Welcome back
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Sign in to your resource reservation account
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
            Or sign in with email
          </span>
        </div>

        {/* Login Form */}
        <form onSubmit={handlePasswordLogin} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Signing in...
              </>
            ) : (
              <>
                Sign In <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-400">
          Don't have an account?{" "}
          <Link href="/register" className="font-semibold text-blue-400 hover:text-blue-300 hover:underline">
            Create Account
          </Link>
        </div>

      </div>
    </div>
  )
}