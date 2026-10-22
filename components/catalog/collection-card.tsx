import Link from "next/link"

import type { CatalogCollection } from "@/lib/data/collections-public"
import { formatMoney } from "@/lib/format"

const KIND_LABELS = { curated: "Selección KONS", artist: "Galería de artista" } as const

// No card chrome: the cover sits on a paper-2 field and the metadata hangs below it in mono.
export function CollectionCard({ item }: { item: CatalogCollection }) {
  return (
    <li>
      <Link href={`/catalogo/${item.slug}`} className="group flex flex-col gap-3 focus-visible:outline-none">
        <div className="relative aspect-[4/5] overflow-hidden bg-paper-2 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-ink">
          {item.coverUrl ? (
            // Short-lived signed URL: the Next image optimizer adds nothing here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.coverUrl}
              alt={`Portada de ${item.title}`}
              loading="lazy"
              className="absolute inset-0 size-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">Sin portada</span>
          )}
          {item.reveal === "mystery" && (
            <span className="absolute left-3 top-3 bg-ink px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-paper">Sorpresa</span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-muted">
            {KIND_LABELS[item.kind]} · {item.itemCount} {item.itemCount === 1 ? "obra" : "obras"}
          </p>
          <h2 className="text-lg font-medium leading-snug underline-offset-4 group-hover:underline">{item.title}</h2>
          {item.space_types.length > 0 && <p className="text-sm text-ink-muted">{item.space_types.join(" · ")}</p>}
          <p className="mt-1 flex items-baseline justify-between font-mono text-sm">
            <span>
              Desde {formatMoney(item.monthly_price)} <span className="text-ink-muted">/ mes</span>
            </span>
            <span className="text-[0.7rem] uppercase tracking-[0.14em] text-ink-muted">{item.busyNow ? "Apartada" : "Disponible"}</span>
          </p>
        </div>
      </Link>
    </li>
  )
}
