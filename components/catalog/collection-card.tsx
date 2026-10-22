import Link from "next/link"

import { ArtImage } from "@/components/site/art-image"
import type { CatalogCollection } from "@/lib/data/collections-public"
import { formatMoney } from "@/lib/format"

const KIND_LABELS = { curated: "Selección KONS", artist: "Galería de artista" } as const
const chip = "px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em]"

// No card chrome: the cover fills its frame and the metadata hangs below it, set in mono and sans.
export function CollectionCard({ item, priority = false }: { item: CatalogCollection; priority?: boolean }) {
  return (
    <li>
      <Link href={`/catalogo/${item.slug}`} className="group flex flex-col gap-3 focus-visible:outline-none">
        <div className="relative aspect-[4/5] overflow-hidden bg-paper-2 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-ink">
          {item.coverUrl ? (
            <ArtImage
              src={item.coverUrl}
              alt={`Portada de ${item.title}`}
              priority={priority}
              className="transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">Sin portada</span>
          )}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            {item.reveal === "mystery" ? <span className={`${chip} bg-ink text-paper`}>Sorpresa</span> : <span />}
            {item.busyNow && <span className={`${chip} bg-paper text-ink`}>Apartada</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-muted">
            {KIND_LABELS[item.kind]} · {item.itemCount} {item.itemCount === 1 ? "obra" : "obras"}
          </p>
          <h3 className="text-xl font-medium leading-tight tracking-tight underline-offset-4 group-hover:underline">{item.title}</h3>
          {item.space_types.length > 0 && <p className="text-sm text-ink-muted">{item.space_types.join(" · ")}</p>}
          <p className="mt-1 font-mono text-sm">
            Desde {formatMoney(item.monthly_price)} <span className="text-ink-muted">/ mes</span>
          </p>
        </div>
      </Link>
    </li>
  )
}
