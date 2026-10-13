"use client"

import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from "@react-oauth/google"
import { useRouter } from "next/navigation"

interface GoogleAuthButtonProps {
  onError: (errorMsg: string) => void
  onSuccess?: (token: string, user: any) => void
}

export default function GoogleAuthButton({ onError, onSuccess }: GoogleAuthButtonProps) {
  const router = useRouter()
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      onError("Google credential was missing.")
      return
    }

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      })
      const data = await res.json()

      if (data.success) {
        const token = data.data?.token || data.token
        const user = data.data?.user || data.user

        if (token && user) {
          localStorage.setItem("token", token)
          localStorage.setItem("user", JSON.stringify(user))

          if (onSuccess) {
            onSuccess(token, user)
          } else {
            router.push("/dashboard")
          }
        } else {
          onError("Failed to parse user session.")
        }
      } else {
        onError(data.error || "Google authentication failed.")
      }
    } catch (err) {
      console.error("Google Auth Error:", err)
      onError("Google authentication service is currently unavailable.")
    }
  }

  if (!clientId) return null

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex justify-center w-full">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => onError("Google Sign-In failed or was cancelled.")}
          theme="filled_black"
          shape="pill"
          size="large"
        />
      </div>
    </GoogleOAuthProvider>
  )
}