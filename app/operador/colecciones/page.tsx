import type { Metadata } from "next"
import Link from "next/link"

import { PublishGalleryButton } from "@/components/operator/publish-gallery-button"
import { listCollectionsAdmin, listPublishableGalleries } from "@/lib/data/collections-admin"
import { formatMoney } from "@/lib/format"

export const metadata: Metadata = { title: "Colecciones · KONS" }

const STATUS_LABELS = { draft: "Borrador", published: "Publicada", retired: "Retirada" } as const
const KIND_LABELS = { curated: "Selección KONS", artist: "Galería de artista" } as const
const REVEAL_LABELS = { mystery: "Sorpresa", open: "Abierta" } as const

export default async function CollectionsPage() {
  const [collections, galleries] = await Promise.all([listCollectionsAdmin(), listPublishableGalleries()])

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-10 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/operador" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Bandeja
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Colecciones</h1>
      </div>

      <Link href="/operador/colecciones/nueva" className="underline underline-offset-4">
        Nueva Selección KONS
      </Link>

      {collections.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay colecciones.</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {collections.map((c) => (
            <li key={c.id} className="flex flex-col gap-1 py-4">
              <div className="flex items-baseline justify-between gap-4">
                <Link href={`/operador/colecciones/${c.id}`} className="font-medium underline underline-offset-4">
                  {c.title}
                </Link>
                <span className="text-sm">{STATUS_LABELS[c.status]}</span>
              </div>
              <p className="font-mono text-xs text-muted-foreground">
                {KIND_LABELS[c.kind]} · {REVEAL_LABELS[c.reveal]} · {c.itemCount} {c.itemCount === 1 ? "obra" : "obras"} ·{" "}
                {formatMoney(c.monthly_price)}/mes
              </p>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="galleries-title" className="flex flex-col gap-3 border-t pt-8">
        <h2 id="galleries-title" className="text-lg font-medium">
          Galerías de artistas disponibles
        </h2>
        {galleries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay galerías con obras libres.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {galleries.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-medium">{g.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {g.artist} · {g.freeCount} {g.freeCount === 1 ? "obra libre" : "obras libres"}
                  </p>
                </div>
                <PublishGalleryButton galleryId={g.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
