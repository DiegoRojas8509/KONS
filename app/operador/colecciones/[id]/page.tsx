import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CollectionForm } from "@/components/operator/collection-form"
import { CollectionItems } from "@/components/operator/collection-items"
import { CollectionStatus } from "@/components/operator/collection-status"
import { PALETTES, SPACES } from "@/lib/constants/artwork"
import { getCollectionAdmin, listFreeArtworks } from "@/lib/data/collections-admin"
import { isUuid } from "@/lib/validations/artwork"

export const metadata: Metadata = { title: "Colección · KONS" }

const STATUS_LABELS = { draft: "Borrador", published: "Publicada", retired: "Retirada" } as const

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()
  const [collection, free] = await Promise.all([getCollectionAdmin(id), listFreeArtworks()])
  if (!collection) notFound()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-10 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/operador/colecciones" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Colecciones
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{collection.title}</h1>
        <p className="text-sm text-muted-foreground">
          Estado: {STATUS_LABELS[collection.status]}
          {collection.status === "published" && (
            <>
              {" · "}
              <Link href={`/catalogo/${collection.slug}`} className="underline underline-offset-4">
                Ver en el sitio
              </Link>
            </>
          )}
        </p>
      </div>

      <CollectionStatus collectionId={collection.id} status={collection.status} />

      <CollectionForm
        collectionId={collection.id}
        defaultValues={{
          title: collection.title,
          description: collection.description ?? "",
          reveal: collection.reveal,
          spaceTypes: SPACES.filter((s) => collection.space_types.includes(s)),
          palette: PALETTES.filter((p) => collection.palette.includes(p)),
          monthlyPrice: String(collection.monthly_price),
        }}
      />

      <CollectionItems collectionId={collection.id} coverId={collection.cover_artwork_id} items={collection.items} free={free} />
    </main>
  )
}
