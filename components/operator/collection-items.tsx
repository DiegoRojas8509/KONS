"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { addCollectionItems, removeCollectionItem, setCollectionCover } from "@/lib/actions/collection"
import type { WorkThumb } from "@/lib/data/collections-admin"
import { formatMoney, formatSize } from "@/lib/format"

type Props = { collectionId: string; coverId: string | null; items: WorkThumb[]; free: WorkThumb[] }

function Thumb({ work }: { work: WorkThumb }) {
  return work.imageUrl ? (
    // Short-lived signed URL: the Next image optimizer adds nothing here.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={work.imageUrl} alt={`${work.title}, de ${work.artist}`} className="aspect-[4/5] w-full bg-paper-2 object-contain p-2" />
  ) : (
    <div className="grid aspect-[4/5] w-full place-items-center bg-paper-2 text-xs text-muted-foreground">Sin imagen</div>
  )
}

export function CollectionItems({ collectionId, coverId, items, free }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<{ error: string } | { message: string }>, after?: () => void) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if ("error" in result) return setError(result.error)
      after?.()
      router.refresh()
    })
  }

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="items-title" className="flex flex-col gap-4">
        <h2 id="items-title" className="text-lg font-medium">
          Obras de la colección ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no tiene obras.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-3">
            {items.map((w) => (
              <li key={w.id} className="flex flex-col gap-2">
                <Thumb work={w} />
                <p className="text-sm font-medium">{w.title}</p>
                <p className="text-xs text-muted-foreground">
                  {w.artist} · {formatSize(w.width_cm, w.height_cm)} · {formatMoney(w.monthly_rent)}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {coverId === w.id ? (
                    <span className="font-medium">Portada</span>
                  ) : (
                    <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(() => setCollectionCover(collectionId, w.id))}>
                      Hacer portada
                    </Button>
                  )}
                  <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(() => removeCollectionItem(collectionId, w.id))}>
                    Quitar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="free-title" className="flex flex-col gap-4">
        <h2 id="free-title" className="text-lg font-medium">
          Obras aprobadas sin colección ({free.length})
        </h2>
        {free.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay obras libres.</p>
        ) : (
          <>
            <ul className="grid gap-4 sm:grid-cols-4">
              {free.map((w) => (
                <li key={w.id}>
                  <label className="flex cursor-pointer flex-col gap-2">
                    <Thumb work={w} />
                    <span className="flex items-start gap-2 text-sm">
                      <input type="checkbox" checked={selected.includes(w.id)} onChange={() => toggle(w.id)} className="mt-1" />
                      <span>
                        {w.title}
                        <span className="block text-xs text-muted-foreground">{w.artist}</span>
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <div>
              <Button type="button" disabled={pending || selected.length === 0} onClick={() => run(() => addCollectionItems(collectionId, selected), () => setSelected([]))}>
                Agregar {selected.length > 0 ? `(${selected.length})` : ""}
              </Button>
            </div>
          </>
        )}
      </section>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
