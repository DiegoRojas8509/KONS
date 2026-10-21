import Link from "next/link"
import { Suspense } from "react"

import { HomeHero } from "@/components/home/home-hero"
import { listCatalog } from "@/lib/data/catalog"

const mono = "font-mono text-xs uppercase tracking-[0.14em]"

async function Hero() {
  const items = await listCatalog()
  return <HomeHero items={items} />
}

export default function HomePage() {
  return (
    <main>
      <Suspense fallback={<section aria-hidden className="min-h-[calc(100svh-5.5rem)]" />}>
        <Hero />
      </Suspense>

      <section className="border-t border-border">
        <div className="mx-auto grid w-full max-w-7xl md:grid-cols-2">
          <div className="flex flex-col items-start gap-5 px-5 py-14 sm:px-8 md:py-20">
            <p className={`${mono} text-ink-muted`}>Para tu espacio</p>
            <h2 className="text-3xl font-medium leading-tight sm:text-4xl">Renovamos tu arte.</h2>
            <p className="max-w-md text-lg text-ink-muted">
              Oficinas, hoteles, restaurantes y eventos rentan una obra original por 3 a 6 meses. Cuando termina el periodo, el
              espacio se renueva.
            </p>
            <Link
              href="/catalogo"
              className={`${mono} inline-flex h-12 items-center bg-ink px-6 text-paper hover:bg-ink/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}
            >
              Ver el catálogo
            </Link>
          </div>
          <div className="flex flex-col items-start gap-5 bg-paper-2 px-5 py-14 sm:px-8 md:py-20">
            <p className={`${mono} text-ink-muted`}>Para artistas</p>
            <h2 className="text-3xl font-medium leading-tight sm:text-4xl">Tu obra, a la vista todos los días.</h2>
            <p className="max-w-md text-lg text-ink-muted">
              Tu trabajo vive en lugares con flujo constante de gente y recibes una comisión por cada renta. Revisamos cada
              solicitud para mantener la colección curada.
            </p>
            <Link
              href="/registro"
              className={`${mono} inline-flex h-12 items-center border border-ink px-6 hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}
            >
              Soy artista
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
