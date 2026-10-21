import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { ArtworkCard } from "@/components/catalog/artwork-card"
import { listCatalog } from "@/lib/data/catalog"

export const metadata: Metadata = {
  title: "Catálogo · KONS",
  description: "Obras originales disponibles en renta por 3 a 6 meses, pensadas para tu espacio.",
}

async function CatalogResults() {
  const items = await listCatalog()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 py-16">
        <p className="max-w-md text-lg">Todavía no hay obras disponibles. Estamos curando la primera colección.</p>
        <Link href="/registro" className="font-mono text-xs uppercase tracking-[0.14em] underline underline-offset-8">
          Soy artista: quiero exhibir
        </Link>
      </div>
    )
  }

  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">
        {items.length} {items.length === 1 ? "obra disponible" : "obras disponibles"}
      </p>
      <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ArtworkCard key={item.id} item={item} />
        ))}
      </ul>
    </>
  )
}

export default function CatalogPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-6xl uppercase leading-[0.9] tracking-tight sm:text-8xl">Catálogo</h1>
        <p className="max-w-xl text-lg text-ink-muted">
          Arte original en renta por 3 a 6 meses. Cuando termina el periodo, tu espacio se renueva.
        </p>
      </div>
      <Suspense fallback={<p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">Cargando obras…</p>}>
        <CatalogResults />
      </Suspense>
    </main>
  )
}
