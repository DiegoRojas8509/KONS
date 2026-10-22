import type { Metadata } from "next"
import Link from "next/link"

import { ArtworkForm } from "@/components/artist/artwork-form"
import { listGalleries } from "@/lib/data/gallery"

export const metadata: Metadata = { title: "Nueva obra · KONS" }

export default async function NewArtworkPage() {
  const galleries = await listGalleries()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/artista/obras" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Mis obras
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva obra</h1>
      </div>
      <ArtworkForm galleries={galleries.map((g) => ({ id: g.id, title: g.title }))} />
    </main>
  )
}
