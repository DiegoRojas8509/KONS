import Link from "next/link"

import type { CatalogCollection } from "@/lib/data/collections-public"
import { formatMoney } from "@/lib/format"

const mono = "font-mono text-[0.65rem] uppercase tracking-[0.14em] sm:text-[0.7rem]"
const KIND_LABELS = { curated: "Selección KONS", artist: "Galería de artista" } as const

function Thumb({ item, className }: { item: CatalogCollection; className: string }) {
  if (!item.coverUrl) return null
  return (
    <Link
      href={`/catalogo/${item.slug}`}
      aria-label={item.title}
      className={`absolute z-10 aspect-[4/5] bg-paper-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${className}`}
    >
      {/* Short-lived signed URL: the Next image optimizer adds nothing here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.coverUrl} alt="" className="size-full object-cover" />
    </Link>
  )
}

// Editorial cover (docs/referencias/inicio-vico.png): one collection as protagonist, loose thumbnails at the edges,
// mono metadata, and the collection's name in giant condensed type that fills the width, bleeds off the bottom and is
// overlapped by its cover. Lettering is sized in vw so the overlap stays proportional at any screen width.
export function HomeHero({ items }: { items: CatalogCollection[] }) {
  // A curated selection leads when there is one: its name is short and made for display.
  const lead = items.find((i) => i.kind === "curated" && i.coverUrl) ?? items.find((i) => i.coverUrl) ?? null
  const thumbs = items.filter((i) => i.id !== lead?.id && i.coverUrl).slice(0, 2)

  // Artist galleries are titled "Gallery · Artist": the giant lettering uses the short part only.
  const headline = lead ? lead.title.split(" · ")[0] : "Renovamos tu espacio"
  // Anton is ~0.42em per capital: this makes the name span about the full width, within sane bounds.
  const size = Math.max(6, Math.min(34, 214 / Math.max(headline.length, 1)))

  return (
    <section
      aria-label="Colección destacada"
      className="relative flex min-h-[34rem] flex-col justify-end overflow-hidden md:min-h-[calc(100svh-5.5rem)]"
      style={{ ["--s" as string]: `${size}vw` }}
    >
      {thumbs[0] && <Thumb item={thumbs[0]} className="left-5 top-6 w-14 sm:left-8 sm:w-20" />}
      {thumbs[1] && <Thumb item={thumbs[1]} className="right-5 top-6 w-14 sm:right-8 sm:top-[34%] sm:w-24" />}

      {/* The cover, pulled down so it covers the top of the lettering. */}
      <div className="relative z-10 mb-[calc(var(--s)*-0.18)] flex justify-center px-5 md:mb-[calc(var(--s)*-0.36)]">
        {lead ? (
          <Link
            href={`/catalogo/${lead.slug}`}
            className="block aspect-[4/5] w-[min(62vw,24rem)] bg-paper-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink md:h-[min(54svh,38rem)] md:w-auto"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lead.coverUrl ?? ""} alt={`Portada de ${lead.title}`} className="size-full object-contain p-3" />
          </Link>
        ) : (
          <div className="pb-10" />
        )}
      </div>

      <div className="relative">
        <div className={`${mono} absolute inset-x-0 top-0 z-20 hidden -translate-y-full items-end justify-between gap-6 px-5 pb-3 sm:px-8 md:flex`}>
          <span className="max-w-[40%]">
            {lead ? `${KIND_LABELS[lead.kind]} · ${lead.itemCount} ${lead.itemCount === 1 ? "obra" : "obras"}` : "Colecciones en preparación"}
          </span>
          <span className="max-w-[40%] text-right">
            {lead ? `Desde ${formatMoney(lead.monthly_price)} / mes · ${lead.busyNow ? "Apartada" : "Disponible"}` : "Kons"}
            {items.length > 0 && <span className="text-ink-muted"> ({items.length})</span>}
          </span>
        </div>
        <h1
          className="relative z-0 mb-[calc(var(--s)*0.04)] whitespace-nowrap text-center font-display uppercase leading-[0.8] tracking-tight text-brand md:-mb-[calc(var(--s)*0.1)]"
          style={{ fontSize: "var(--s)" }}
        >
          {headline}
        </h1>
      </div>
    </section>
  )
}
