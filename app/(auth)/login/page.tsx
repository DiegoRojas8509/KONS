import type { Metadata } from "next"
import { Suspense } from "react"

import { LoginForm } from "@/components/auth/login-form"
import { Wordmark } from "@/components/site/wordmark"

export const metadata: Metadata = { title: "Iniciar sesión · KONS" }

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-8 px-6 py-12">
      <div className="flex flex-col gap-10">
        <Wordmark className="text-6xl" />
        <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
      </div>
      {/* useSearchParams in the form needs a Suspense boundary so the page can still be prerendered */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  )
}
