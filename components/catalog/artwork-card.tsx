import Link from "next/link"

import type { CatalogItem } from "@/lib/data/catalog"
import { formatMoney, formatOrientation, formatSize } from "@/lib/format"

// No card chrome: the work sits on a paper-2 field and the metadata hangs below it in mono.
export function ArtworkCard({ item }: { item: CatalogItem }) {
  return (
    <li>
      <Link href={`/catalogo/${item.id}`} className="group flex flex-col gap-3 focus-visible:outline-none">
        <div className="relative aspect-[4/5] overflow-hidden bg-paper-2 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-ink">
          {item.imageUrl ? (
            // Short-lived signed URL: the Next image optimizer adds nothing here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt={`${item.title}, de ${item.artist_name}`}
              loading="lazy"
              className="absolute inset-0 size-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">
              Sin imagen
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-muted">
            {formatSize(item.width_cm, item.height_cm)} · {formatOrientation(item.orientation)}
          </p>
          <h2 className="text-lg font-medium leading-snug underline-offset-4 group-hover:underline">{item.title}</h2>
          <p className="text-sm text-ink-muted">{item.artist_name}</p>
          <p className="mt-1 font-mono text-sm">
            {formatMoney(item.monthly_rent)} <span className="text-ink-muted">/ mes</span>
          </p>
        </div>
      </Link>
    </li>
  )
}
