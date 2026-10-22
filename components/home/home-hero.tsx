import Link from "next/link"

import { ArtImage } from "@/components/site/art-image"
import type { CatalogCollection } from "@/lib/data/collections-public"
import { formatMoney } from "@/lib/format"

const KIND_LABELS = { curated: "Selección KONS", artist: "Galería de artista" } as const
const chip = "absolute bottom-0 left-0 max-w-full bg-paper px-2.5 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em]"

function Frame({ item, className, priority = false }: { item: CatalogCollection; className: string; priority?: boolean }) {
  return (
    <Link
      href={`/catalogo/${item.slug}`}
      aria-label={item.title}
      className={`group relative block overflow-hidden bg-paper-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink ${className}`}
    >
      {item.coverUrl && (
        <ArtImage
          src={item.coverUrl}
          alt={`Portada de ${item.title}`}
          priority={priority}
          className="transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
        />
      )}
      <span className={chip}>
        {priority
          ? `${KIND_LABELS[item.kind]} · ${item.itemCount} ${item.itemCount === 1 ? "obra" : "obras"} · desde ${formatMoney(item.monthly_price)} / mes`
          : item.title.split(" · ")[0]}
      </span>
    </Link>
  )
}

// Editorial cover (docs/referencias/inicio-vico.png): a triptych of real collection covers, the lead one in the middle,
// and the lead's name in giant condensed type that fills the width and runs under the images. The lettering is sized
// in vw so the overlap stays proportional at any width.
export function HomeHero({ items }: { items: CatalogCollection[] }) {
  const withCover = items.filter((i) => i.coverUrl)
  // A curated selection leads when there is one: its name is short and made for display.
  const lead = withCover.find((i) => i.kind === "curated") ?? withCover[0] ?? null
  const sides = withCover.filter((i) => i.id !== lead?.id).slice(0, 2)

  // Artist galleries are titled "Gallery · Artist": the giant lettering uses the short part only.
  const headline = lead ? lead.title.split(" · ")[0] : "Renovamos tu espacio"
  // Anton is ~0.42em per capital: this makes the name span about the full width, within sane bounds.
  const size = Math.max(6, Math.min(21, 214 / Math.max(headline.length, 1)))

  return (
    <section aria-label="Colecciones destacadas" className="relative overflow-hidden" style={{ ["--s" as string]: `${size}vw` }}>
      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-12 items-end gap-3 px-5 pt-6 sm:gap-6 sm:px-8 md:pt-10">
        {sides[0] && <Frame item={sides[0]} className="col-span-3 mb-[calc(var(--s)*0.55)] hidden h-[min(40svh,24rem)] md:block" />}
        {lead ? (
          <Frame item={lead} priority className="col-span-12 h-[min(60svh,34rem)] md:col-span-6" />
        ) : (
          <div className="col-span-12 h-24" />
        )}
        {sides[1] && <Frame item={sides[1]} className="col-span-3 mb-[calc(var(--s)*0.25)] hidden h-[min(48svh,28rem)] md:block" />}
      </div>

      <h1
        className="relative z-0 whitespace-nowrap text-center font-display uppercase leading-[0.8] tracking-tight text-brand"
        style={{ fontSize: "var(--s)", marginTop: "calc(var(--s) * -0.3)", paddingTop: "calc(var(--s) * 0.3)", marginBottom: "calc(var(--s) * -0.08)" }}
      >
        {headline}
      </h1>
    </section>
  )
}
