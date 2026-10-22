import Link from "next/link"

import { ArtImage } from "@/components/site/art-image"
import type { CollectionWork } from "@/lib/data/collections-public"
import { formatOrientation, formatSize } from "@/lib/format"

// No card chrome: the work sits on a paper-2 field and the metadata hangs below it in mono.
export function ArtworkCard({ item }: { item: CollectionWork }) {
  return (
    <li>
      <Link href={`/catalogo/obra/${item.id}`} className="group flex flex-col gap-3 focus-visible:outline-none">
        <div className="relative aspect-[4/5] overflow-hidden bg-paper-2 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-ink">
          {item.imageUrl ? (
            <ArtImage
              src={item.imageUrl}
              alt={`${item.title}, de ${item.artist_name}`}
              className="transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">Sin imagen</span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-muted">
            {formatSize(item.width_cm, item.height_cm)} · {formatOrientation(item.orientation)}
          </p>
          <h2 className="text-lg font-medium leading-snug underline-offset-4 group-hover:underline">{item.title}</h2>
          <p className="text-sm text-ink-muted">{item.artist_name}</p>
        </div>
      </Link>
    </li>
  )
}
