import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { CatalogFiltersForm } from "@/components/catalog/catalog-filters"
import { CollectionCard } from "@/components/catalog/collection-card"
import { SectionHeader } from "@/components/site/section-header"
import { listPublicCollections } from "@/lib/data/collections-public"
import { hasActiveFilters, parseCatalogFilters } from "@/lib/validations/catalog"

export const metadata: Metadata = { title: "Catálogo · KONS" }

type SearchParams = Promise<Record<string, string | string[] | undefined>>

const GROUPS = [
  { kind: "curated", title: "Selecciones KONS" },
  { kind: "artist", title: "Galerías de artista" },
] as const

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
        <div className="flex flex-col gap-16">
          {GROUPS.map(({ kind, title }) => {
            const group = items.filter((i) => i.kind === kind)
            if (group.length === 0) return null
            return (
              <section key={kind} aria-label={title} className="flex flex-col gap-8">
                <SectionHeader title={title} count={group.length} />
                <ul className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map((item, i) => (
                    <CollectionCard key={item.id} item={item} priority={kind === "curated" && i < 3} />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
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
