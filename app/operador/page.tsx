import type { Metadata } from "next"

import { SignOutButton } from "@/components/auth/sign-out-button"

export const metadata: Metadata = { title: "Bandeja del operador · KONS" }

// Placeholder: the review inbox arrives with SCRUM-20.
export default function OperatorPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Bandeja de revisión</h1>
      <p className="text-muted-foreground">En construcción.</p>
      <SignOutButton />
    </main>
  )
}
