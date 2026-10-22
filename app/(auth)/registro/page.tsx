import type { Metadata } from "next"

import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = { title: "Soy artista · KONS" }

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-8 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Soy artista</h1>
      <RegisterForm />
    </main>
  )
}
