import Link from "next/link"

import type { CatalogItem } from "@/lib/data/catalog"
import { formatOrientation, formatSize } from "@/lib/format"

const mono = "font-mono text-[0.65rem] uppercase tracking-[0.14em] sm:text-[0.7rem]"

function Thumb({ item, className }: { item: CatalogItem; className: string }) {
  if (!item.imageUrl) return null
  return (
    <Link
      href={`/catalogo/${item.id}`}
      aria-label={`${item.title}, de ${item.artist_name}`}
      className={`absolute z-10 aspect-[4/5] bg-paper-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${className}`}
    >
      {/* Short-lived signed URL: the Next image optimizer adds nothing here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.imageUrl} alt="" className="size-full object-cover" />
    </Link>
  )
}

// Editorial cover (docs/referencias/inicio-vico.png): one approved work as protagonist, loose thumbnails at the edges,
// mono metadata, and the artist's name in giant condensed type that fills the width, bleeds off the bottom and is
// overlapped by the work. Lettering is sized in vw so the overlap stays proportional at any screen width.
export function HomeHero({ items }: { items: CatalogItem[] }) {
  const lead = items.find((i) => i.imageUrl) ?? null
  const thumbs = items.filter((i) => i.id !== lead?.id && i.imageUrl).slice(0, 2)

  const headline = lead ? lead.artist_name : "Renovamos tu espacio"
  // Anton is ~0.42em per capital: this makes the name span about the full width, within sane bounds.
  const size = Math.max(8, Math.min(34, 214 / Math.max(headline.length, 1)))

  return (
    <section
      aria-label="Obra destacada"
      className="relative flex min-h-[34rem] flex-col justify-end overflow-hidden md:min-h-[calc(100svh-5.5rem)]"
      style={{ ["--s" as string]: `${size}vw` }}
    >
      {thumbs[0] && <Thumb item={thumbs[0]} className="left-5 top-6 w-14 sm:left-8 sm:w-20" />}
      {thumbs[1] && <Thumb item={thumbs[1]} className="right-5 top-6 w-14 sm:right-8 sm:top-[34%] sm:w-24" />}

      {/* The work, pulled down so it covers the top of the lettering. */}
      <div className="relative z-10 mb-[calc(var(--s)*-0.18)] flex justify-center px-5 md:mb-[calc(var(--s)*-0.36)]">
        {lead ? (
          <Link
            href={`/catalogo/${lead.id}`}
            className="block aspect-[4/5] w-[min(62vw,24rem)] bg-paper-2 md:h-[min(54svh,38rem)] md:w-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lead.imageUrl ?? ""} alt={`${lead.title}, de ${lead.artist_name}`} className="size-full object-contain p-3" />
          </Link>
        ) : (
          <div className="pb-10" />
        )}
      </div>

      <div className="relative">
        <div className={`${mono} absolute inset-x-0 top-0 z-20 hidden -translate-y-full md:flex items-end justify-between gap-6 px-5 pb-3 sm:px-8`}>
          <span className="max-w-[40%]">
            {lead ? [lead.technique, formatSize(lead.width_cm, lead.height_cm)].filter(Boolean).join(" · ") : "Colección en preparación"}
          </span>
          <span className="max-w-[40%] text-right">
            {lead ? `${lead.title} · ${formatOrientation(lead.orientation)}` : "Kons"}
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
