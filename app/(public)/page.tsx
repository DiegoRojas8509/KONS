import Link from "next/link"
import { Suspense } from "react"

import { CollectionCard } from "@/components/catalog/collection-card"
import { HomeHero } from "@/components/home/home-hero"
import { SectionHeader } from "@/components/site/section-header"
import { PLANS, PLAN_IDS, planSummary } from "@/lib/constants/plans"
import { getAdvisorLinks } from "@/lib/contact"
import { listPublicCollections } from "@/lib/data/collections-public"

const mono = "font-mono text-xs uppercase tracking-[0.14em]"
const button =
  "inline-flex h-12 items-center px-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"

async function Collections() {
  const items = await listPublicCollections()
  const curated = items.filter((i) => i.kind === "curated")
  const galleries = items.filter((i) => i.kind === "artist")

  return (
    <>
      <HomeHero items={items} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-5 py-16 sm:px-8 md:py-24">
        {curated.length > 0 && (
          <section aria-label="Selecciones KONS" className="flex flex-col gap-8">
            <SectionHeader title="Selecciones KONS" count={curated.length} href="/catalogo" hrefLabel="Ver colecciones" />
            <ul className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {curated.slice(0, 4).map((c) => (
                <CollectionCard key={c.id} item={c} />
              ))}
            </ul>
          </section>
        )}
        {galleries.length > 0 && (
          <section aria-label="Galerías de artista" className="flex flex-col gap-8">
            <SectionHeader title="Galerías de artista" count={galleries.length} href="/catalogo" hrefLabel="Ver colecciones" />
            <ul className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {galleries.slice(0, 4).map((c) => (
                <CollectionCard key={c.id} item={c} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}

export default function HomePage() {
  const advisor = getAdvisorLinks()
  const advisorHref = advisor.whatsapp ?? advisor.email

  return (
    <main>
      <Suspense fallback={<section aria-hidden className="min-h-[34rem] md:min-h-[calc(100svh-5.5rem)]" />}>
        <Collections />
      </Suspense>

      <section aria-labelledby="plans-title" className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-16 sm:px-8 md:py-24">
          <SectionHeader title="Planes" />
          <h2 id="plans-title" className="sr-only">
            Planes
          </h2>
          <ul className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_IDS.map((id) => (
              <li key={id} className="flex min-h-48 flex-col justify-between gap-6 bg-paper p-6">
                <div className="flex flex-col gap-2">
                  <p className="font-display text-4xl uppercase leading-none">{PLANS[id].label}</p>
                  <p className="font-mono text-xs uppercase leading-relaxed tracking-[0.1em] text-ink-muted">{planSummary(id)}</p>
                </div>
                <p className="font-mono text-sm">{PLANS[id].discount > 0 ? `−${Math.round(PLANS[id].discount * 100)} %` : "Precio de lista"}</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/catalogo" className={`${mono} ${button} bg-ink text-paper hover:bg-ink/85`}>
              Ver colecciones
            </Link>
            {advisorHref && (
              <a href={advisorHref} target={advisor.whatsapp ? "_blank" : undefined} rel="noopener noreferrer" className={`${mono} ${button} border border-ink hover:bg-paper-2`}>
                Hablar con un asesor
              </a>
            )}
            <Link href="/registro" className={`${mono} underline underline-offset-8`}>
              Soy artista
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
