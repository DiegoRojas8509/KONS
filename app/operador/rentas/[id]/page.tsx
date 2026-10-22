import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { RentalReviewForm } from "@/components/operator/rental-review-form"
import { FREQUENCY_LABELS, PLANS, RENTAL_STATUS_LABELS } from "@/lib/constants/plans"
import { getRental } from "@/lib/data/rentals-admin"
import { isUuid } from "@/lib/validations/artwork"

export const metadata: Metadata = { title: "Solicitud de renta · KONS" }

const dateFormat = new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" })
const dateTime = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" })

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-line">{value || "—"}</dd>
    </div>
  )
}

export default async function RentalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()
  const rental = await getRental(id)
  if (!rental) notFound()
  const plan = PLANS[rental.plan]

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/operador?tab=rentas" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Bandeja
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{rental.folio}</h1>
        <p className="text-sm text-muted-foreground">Estado: {RENTAL_STATUS_LABELS[rental.status]}</p>
      </div>

      <dl className="grid gap-5 sm:grid-cols-2">
        <Field label="Colección" value={rental.collection?.title ?? null} />
        <Field label="Plan" value={plan.label} />
        <Field label="Pago" value={FREQUENCY_LABELS[rental.payment_frequency]} />
        <Field label="Fechas apartadas" value={`${dateFormat.format(new Date(`${rental.start_date}T00:00:00Z`))} al ${dateFormat.format(new Date(`${rental.end_date}T00:00:00Z`))}`} />
        <Field label="Cliente" value={rental.client_name} />
        <Field label="Empresa" value={rental.company} />
        <Field label="Correo" value={rental.email} />
        <Field label="Teléfono" value={rental.phone} />
        <Field label="Tipo de espacio" value={rental.space_type} />
        <Field label="Ciudad" value={rental.city} />
      </dl>
      <dl className="flex flex-col gap-5">
        <Field label="Mensaje" value={rental.message} />
        <Field label="Términos aceptados" value={`Versión ${rental.terms_version} · ${dateTime.format(new Date(rental.accepted_terms_at))}`} />
      </dl>

      {rental.status === "pending" ? (
        <RentalReviewForm requestId={rental.id} />
      ) : (
        <section className="flex flex-col gap-1 border-t pt-6">
          <p className="font-medium">
            {RENTAL_STATUS_LABELS[rental.status]}
            {rental.reviewed_at && ` · ${dateTime.format(new Date(rental.reviewed_at))}`}
          </p>
          {rental.review_notes && <p className="text-muted-foreground">{rental.review_notes}</p>}
        </section>
      )}
    </main>
  )
}
