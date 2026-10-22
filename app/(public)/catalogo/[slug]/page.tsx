import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { ArtworkCard } from "@/components/catalog/artwork-card"
import { AvailabilityCalendar } from "@/components/catalog/availability-calendar"
import { RentalRequestForm } from "@/components/catalog/rental-request-form"
import { getAdvisorLinks } from "@/lib/contact"
import { getPublicCollection } from "@/lib/data/collections-public"
import { formatMoney } from "@/lib/format"

const KIND_LABELS = { curated: "Selección KONS", artist: "Galería de artista" } as const
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const collection = SLUG.test(slug) ? await getPublicCollection(slug) : null
  return { title: collection ? `${collection.title} · KONS` : "Colección no encontrada · KONS" }
}

const chip = "border border-border px-2 py-1 font-mono text-[0.7rem] uppercase tracking-[0.1em]"

async function CollectionDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!SLUG.test(slug)) notFound()
  const collection = await getPublicCollection(slug)
  if (!collection) notFound()

  const advisor = getAdvisorLinks(`la colección "${collection.title}"`)

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16 lg:py-16">
      <div className="flex flex-col gap-10">
        <div className="grid place-items-center bg-paper-2 p-4 sm:p-8">
          {collection.coverUrl ? (
            // Short-lived signed URL: the Next image optimizer adds nothing here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={collection.coverUrl} alt={`Portada de ${collection.title}`} className="max-h-[80vh] w-auto max-w-full object-contain" />
          ) : (
            <div className="grid aspect-[4/5] w-full place-items-center font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">Sin portada</div>
          )}
        </div>

        {collection.reveal === "open" && collection.works.length > 0 && (
          <section aria-labelledby="works-title" className="flex flex-col gap-4">
            <h2 id="works-title" className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-muted">
              Obras ({collection.works.length})
            </h2>
            <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2">
              {collection.works.map((w) => (
                <ArtworkCard key={w.id} item={w} />
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Link href="/catalogo" className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted underline-offset-8 hover:underline">
            ← Colecciones
          </Link>
          <h1 className="font-display text-5xl uppercase leading-[0.95] sm:text-6xl">{collection.title}</h1>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">
            {KIND_LABELS[collection.kind]} · {collection.reveal === "mystery" ? "Sorpresa · " : ""}
            {collection.itemCount} {collection.itemCount === 1 ? "obra" : "obras"}
          </p>
          {collection.description && <p>{collection.description}</p>}
        </div>

        <p className="font-mono text-2xl">
          Desde {formatMoney(collection.monthly_price)} <span className="text-base text-ink-muted">/ mes</span>
        </p>

        {(collection.space_types.length > 0 || collection.palette.length > 0) && (
          <ul className="flex flex-wrap gap-2">
            {[...collection.space_types, ...collection.palette].map((t) => (
              <li key={t} className={chip}>
                {t}
              </li>
            ))}
          </ul>
        )}

        <AvailabilityCalendar ranges={collection.availability} />

        <RentalRequestForm collectionId={collection.id} monthlyPrice={collection.monthly_price} />

        {(advisor.whatsapp || advisor.email) && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5 font-mono text-xs uppercase tracking-[0.14em]">
            {advisor.whatsapp && (
              <a href={advisor.whatsapp} target="_blank" rel="noopener noreferrer" className="underline underline-offset-8">
                Hablar con un asesor
              </a>
            )}
            {advisor.email && (
              <a href={advisor.email} className="underline underline-offset-8">
                Escribir por correo
              </a>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-7xl px-5 py-16 font-mono text-xs uppercase tracking-[0.14em] text-ink-muted sm:px-8">Cargando…</main>}>
      <CollectionDetail params={params} />
    </Suspense>
  )
}
