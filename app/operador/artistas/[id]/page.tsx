import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ReviewHistory } from "@/components/operator/review-history"
import { ReviewForm } from "@/components/operator/review-form"
import { getArtistForReview, listReviewLogs } from "@/lib/data/operator"
import { isUuid } from "@/lib/validations/artwork"

export const metadata: Metadata = { title: "Revisar artista · KONS" }

const STATUS_LABELS = { pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado" } as const

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-line">{value || "—"}</dd>
    </div>
  )
}

export default async function ReviewArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()
  const [artist, logs] = await Promise.all([getArtistForReview(id), listReviewLogs("artist", id)])
  if (!artist) notFound()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/operador?tab=artistas" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Bandeja
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{artist.display_name}</h1>
        <p className="text-sm text-muted-foreground">Estado: {STATUS_LABELS[artist.status]}</p>
      </div>

      <dl className="flex flex-col gap-5">
        <Field label="Nombre completo" value={artist.full_name} />
        <Field label="Correo" value={artist.email} />
        <Field label="Ciudad" value={artist.city} />
        <Field label="Instagram" value={artist.instagram ? `@${artist.instagram}` : null} />
        <Field label="Bio" value={artist.bio} />
        <Field label="Declaración artística" value={artist.statement} />
      </dl>

      {artist.status === "pending" ? (
        <ReviewForm entityType="artist" entityId={artist.id} />
      ) : (
        <p className="text-muted-foreground">Esta solicitud ya fue resuelta.</p>
      )}

      <ReviewHistory logs={logs} />
    </main>
  )
}
