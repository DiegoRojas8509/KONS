import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ArtworkForm } from "@/components/artist/artwork-form"
import { ARTWORK_STATUS_LABELS, PALETTES, SPACES } from "@/lib/constants/artwork"
import { ArtworkImages } from "@/components/artist/artwork-images"
import { getArtworkImages, getMyArtwork } from "@/lib/data/artwork"
import { listGalleries } from "@/lib/data/gallery"
import { formatOrientation } from "@/lib/format"
import { SubmitForReview } from "@/components/artist/submit-for-review"
import { artworkIdSchema, getSubmissionProblems } from "@/lib/validations/artwork"

export const metadata: Metadata = { title: "Obra · KONS" }

export default async function ArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!artworkIdSchema.safeParse(id).success) notFound()
  const [artwork, galleries, images] = await Promise.all([getMyArtwork(id), listGalleries(), getArtworkImages(id)])
  if (!artwork) notFound()

  const editable = artwork.status === "draft" || artwork.status === "rejected"

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/artista/obras" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Mis obras
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{artwork.title}</h1>
        <p className="text-sm text-muted-foreground">
          Estado: {ARTWORK_STATUS_LABELS[artwork.status]} · Orientación: {formatOrientation(artwork.orientation)}
        </p>
      </div>

      {artwork.rejectionNote && (
        <div role="note" className="flex flex-col gap-1 border-l-2 pl-4">
          <p className="text-sm font-medium">Motivo del rechazo</p>
          <p>{artwork.rejectionNote}</p>
        </div>
      )}

      {editable ? (
        <ArtworkForm
          artworkId={artwork.id}
          galleries={galleries.map((g) => ({ id: g.id, title: g.title }))}
          defaultValues={{
            title: artwork.title,
            technique: artwork.technique ?? "",
            year: artwork.year?.toString() ?? "",
            widthCm: String(artwork.width_cm),
            heightCm: String(artwork.height_cm),
            depthCm: artwork.depth_cm?.toString() ?? "",
            dominantPalette: PALETTES.filter((p) => artwork.dominant_palette.includes(p)),
            recommendedSpaces: SPACES.filter((s) => artwork.recommended_spaces.includes(s)),
            monthlyRent: String(artwork.monthly_rent),
            salePrice: artwork.sale_price?.toString() ?? "",
            galleryId: artwork.gallery_id ?? "",
          }}
        />
      ) : (
        <p className="text-muted-foreground">
          Esta obra está en estado “{ARTWORK_STATUS_LABELS[artwork.status]}” y ya no se puede editar.
        </p>
      )}

      <ArtworkImages artworkId={artwork.id} images={images} editable={editable} />

      {editable && (
        <SubmitForReview
          artworkId={artwork.id}
          problems={getSubmissionProblems(
            artwork,
            images.map((i) => ({ is_primary: i.isPrimary })),
          )}
        />
      )}
    </main>
  )
}
