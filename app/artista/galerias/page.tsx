import type { Metadata } from "next"
import Link from "next/link"

import { listGalleries } from "@/lib/data/gallery"

export const metadata: Metadata = { title: "Mis galerías · KONS" }

export default async function GalleriesPage() {
  const galleries = await listGalleries()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/artista" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Volver al panel
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Mis galerías</h1>
        <p className="text-muted-foreground">Agrupa tu obra en colecciones.</p>
      </div>
      <Link href="/artista/galerias/nueva" className="underline underline-offset-4">
        Crear galería
      </Link>
      {galleries.length === 0 ? (
        <p className="text-muted-foreground">Todavía no tienes galerías.</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {galleries.map((g) => (
            <li key={g.id} className="flex flex-col gap-1 py-4">
              <Link href={`/artista/galerias/${g.id}`} className="font-medium underline underline-offset-4">
                {g.title}
              </Link>
              {g.description && <p className="text-sm text-muted-foreground">{g.description}</p>}
              <p className="font-mono text-xs text-muted-foreground">/{g.slug}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
