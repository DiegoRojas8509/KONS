import type { Metadata } from "next"
import Link from "next/link"

import { ARTWORK_STATUS_LABELS } from "@/lib/constants/artwork"
import { listMyArtworks } from "@/lib/data/artwork"

export const metadata: Metadata = { title: "Mis obras · KONS" }

const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })

export default async function ArtworksPage() {
  const artworks = await listMyArtworks()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/artista" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Volver al panel
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Mis obras</h1>
      </div>
      <Link href="/artista/obras/nueva" className="underline underline-offset-4">
        Agregar obra
      </Link>
      {artworks.length === 0 ? (
        <p className="text-muted-foreground">Todavía no has agregado obras.</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {artworks.map((a) => (
            <li key={a.id} className="flex flex-col gap-1 py-4">
              <div className="flex items-baseline justify-between gap-4">
                <Link href={`/artista/obras/${a.id}`} className="font-medium underline underline-offset-4">
                  {a.title}
                </Link>
                <span className="text-sm">{ARTWORK_STATUS_LABELS[a.status]}</span>
              </div>
              <p className="font-mono text-xs text-muted-foreground">
                {a.width_cm} × {a.height_cm} cm · {a.orientation} · {money.format(a.monthly_rent)}/mes
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
