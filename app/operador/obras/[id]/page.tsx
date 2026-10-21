import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { z } from "zod"

import { ReviewHistory } from "@/components/operator/review-history"
import { ReviewForm } from "@/components/operator/review-form"
import { ARTWORK_STATUS_LABELS } from "@/lib/constants/artwork"
import { getArtworkImages } from "@/lib/data/artwork"
import { getArtworkForReview, listReviewLogs } from "@/lib/data/operator"

export const metadata: Metadata = { title: "Revisar obra · KONS" }

const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  )
}

export default async function ReviewArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) notFound()
  const [artwork, images, logs] = await Promise.all([getArtworkForReview(id), getArtworkImages(id), listReviewLogs("artwork", id)])
  if (!artwork) notFound()

  const dimensions = [artwork.width_cm, artwork.height_cm, artwork.depth_cm].filter((n) => n !== null).join(" × ")

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/operador?tab=obras" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Bandeja
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{artwork.title}</h1>
        <p className="text-sm text-muted-foreground">
          {artwork.artist_name} · Estado: {ARTWORK_STATUS_LABELS[artwork.status]}
        </p>
      </div>

      {images.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {images.map((image, i) => (
            <li key={image.id}>
              {/* Short-lived signed URL: the Next image optimizer adds nothing here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={`Imagen ${i + 1} de ${artwork.title}`} className="aspect-[4/3] w-full rounded-md object-cover" />
              {image.isPrimary && <p className="mt-1 text-sm font-medium">Principal</p>}
            </li>
          ))}
        </ul>
      )}

      <dl className="grid gap-5 sm:grid-cols-2">
        <Field label="Técnica" value={artwork.technique} />
        <Field label="Año" value={artwork.year?.toString() ?? null} />
        <Field label="Medidas (cm)" value={dimensions} />
        <Field label="Orientación" value={artwork.orientation} />
        <Field label="Paleta" value={artwork.dominant_palette.join(", ")} />
        <Field label="Espacios recomendados" value={artwork.recommended_spaces.join(", ")} />
        <Field label="Renta mensual" value={money.format(artwork.monthly_rent)} />
        <Field label="Precio de venta" value={artwork.sale_price !== null ? money.format(artwork.sale_price) : null} />
      </dl>

      {artwork.status === "pending_review" ? (
        <ReviewForm entityType="artwork" entityId={artwork.id} />
      ) : (
        <p className="text-muted-foreground">Esta obra no está pendiente de revisión.</p>
      )}

      <ReviewHistory logs={logs} />
    </main>
  )
}
