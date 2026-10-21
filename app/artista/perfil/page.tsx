import type { Metadata } from "next"
import Link from "next/link"

import { ProfileForm } from "@/components/artist/profile-form"
import { getCurrentArtist } from "@/lib/data/artist"

export const metadata: Metadata = { title: "Mi perfil · KONS" }

export default async function ArtistProfilePage() {
  // The layout gate guarantees an approved artist here.
  const artist = await getCurrentArtist()
  if (!artist) return null

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/artista" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Volver al panel
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Mi perfil</h1>
      </div>
      <ProfileForm
        defaultValues={{
          displayName: artist.display_name,
          bio: artist.bio ?? "",
          statement: artist.statement ?? "",
          city: artist.city ?? "",
          instagram: artist.instagram ? `@${artist.instagram}` : "",
        }}
      />
    </main>
  )
}
