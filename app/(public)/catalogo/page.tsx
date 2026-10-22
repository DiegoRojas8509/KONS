import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { CatalogFiltersForm } from "@/components/catalog/catalog-filters"
import { CollectionCard } from "@/components/catalog/collection-card"
import { listPublicCollections } from "@/lib/data/collections-public"
import { hasActiveFilters, parseCatalogFilters } from "@/lib/validations/catalog"

export const metadata: Metadata = { title: "Catálogo · KONS" }

type SearchParams = Promise<Record<string, string | string[] | undefined>>

async function CatalogResults({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseCatalogFilters(await searchParams)
  const filtered = hasActiveFilters(filters)
  const items = await listPublicCollections(filters)

  return (
    <>
      <CatalogFiltersForm filters={filters} />
      {items.length === 0 ? (
        <div className="flex flex-col items-start gap-4 py-12">
          {filtered ? (
            <>
              <p className="max-w-md text-lg">Ninguna colección cumple con todos esos filtros.</p>
              <Link href="/catalogo" className="font-mono text-xs uppercase tracking-[0.14em] underline underline-offset-8">
                Limpiar filtros
              </Link>
            </>
          ) : (
            <p className="max-w-md text-lg">Aún no hay colecciones disponibles.</p>
          )}
        </div>
      ) : (
        <>
          <p role="status" className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">
            {items.length} {items.length === 1 ? "colección" : "colecciones"} {filtered ? "con esos filtros" : ""}
          </p>
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <CollectionCard key={item.id} item={item} />
            ))}
          </ul>
        </>
      )}
    </>
  )
}

export default function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="font-display text-6xl uppercase leading-[0.9] tracking-tight sm:text-8xl">Colecciones</h1>
      <Suspense fallback={<p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">Cargando…</p>}>
        <CatalogResults searchParams={searchParams} />
      </Suspense>
    </main>
  )
}
