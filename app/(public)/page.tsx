import Link from "next/link"
import { Suspense } from "react"

import { HomeHero } from "@/components/home/home-hero"
import { PLANS, PLAN_IDS, planSummary } from "@/lib/constants/plans"
import { getAdvisorLinks } from "@/lib/contact"
import { listPublicCollections } from "@/lib/data/collections-public"

const mono = "font-mono text-xs uppercase tracking-[0.14em]"
const button =
  "inline-flex h-12 items-center px-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"

async function Hero() {
  const items = await listPublicCollections()
  return <HomeHero items={items} />
}

export default function HomePage() {
  const advisor = getAdvisorLinks()
  const advisorHref = advisor.whatsapp ?? advisor.email

  return (
    <main>
      <Suspense fallback={<section aria-hidden className="min-h-[34rem] md:min-h-[calc(100svh-5.5rem)]" />}>
        <Hero />
      </Suspense>

      <section aria-labelledby="plans-title" className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-14 sm:px-8 md:py-20">
          <h2 id="plans-title" className={`${mono} text-ink-muted`}>
            Planes
          </h2>
          <ul className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_IDS.map((id) => (
              <li key={id} className="flex flex-col gap-3 bg-paper p-5">
                <p className="font-display text-3xl uppercase leading-none">{PLANS[id].label}</p>
                <p className="font-mono text-xs uppercase leading-relaxed tracking-[0.1em] text-ink-muted">{planSummary(id)}</p>
                {PLANS[id].discount > 0 && <p className="font-mono text-sm">−{Math.round(PLANS[id].discount * 100)} %</p>}
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
