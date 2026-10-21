import type { Metadata } from "next"

import { SignOutButton } from "@/components/auth/sign-out-button"

export const metadata: Metadata = { title: "Panel del artista · KONS" }

// Placeholder: the real panel arrives with the artist review stories (SCRUM-14, SCRUM-15).
export default function ArtistPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Panel del artista</h1>
      <p className="text-muted-foreground">En construcción.</p>
      <SignOutButton />
    </main>
  )
}
