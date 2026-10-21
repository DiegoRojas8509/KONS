import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { z } from "zod"

import { getPublicArtwork } from "@/lib/data/public-artwork"
import { getContactLinks } from "@/lib/contact"
import { formatMoney, formatOrientation, formatSize } from "@/lib/format"

const idSchema = z.string().uuid()

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const artwork = idSchema.safeParse(id).success ? await getPublicArtwork(id) : null
  if (!artwork) return { title: "Obra no encontrada · KONS" }
  return {
    title: `${artwork.title}, ${artwork.artist.display_name} · KONS`,
    description: `${artwork.title}, de ${artwork.artist.display_name}. ${formatSize(artwork.width_cm, artwork.height_cm)}. En renta por 3 a 6 meses.`,
  }
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-t border-border pt-3">
      <dt className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-muted">{label}</dt>
      <dd className="first-letter:uppercase">{children}</dd>
    </div>
  )
}

const cta =
  "inline-flex h-12 items-center justify-center px-6 font-mono text-xs uppercase tracking-[0.14em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"

async function ArtworkDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!idSchema.safeParse(id).success) notFound()
  const artwork = await getPublicArtwork(id)
  if (!artwork) notFound()

  const contact = getContactLinks(artwork.title, artwork.artist.display_name)
  const instagram = artwork.artist.instagram

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16 lg:py-16">
      <div className="flex flex-col gap-4">
        {artwork.images.length === 0 ? (
          <div className="grid aspect-[4/5] place-items-center bg-paper-2 font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">
            Sin imagen
          </div>
        ) : (
          artwork.images.map((image, i) => (
            <div key={image.id} className="grid place-items-center bg-paper-2 p-4 sm:p-8">
              {/* Short-lived signed URL: the Next image optimizer adds nothing here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={i === 0 ? `${artwork.title}, de ${artwork.artist.display_name}` : `${artwork.title}, vista ${i + 1}`}
                className="max-h-[80vh] w-auto max-w-full object-contain"
              />
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-8 lg:sticky lg:top-8 lg:self-start">
        <div className="flex flex-col gap-3">
          <Link href="/catalogo" className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted underline-offset-8 hover:underline">
            ← Catálogo
          </Link>
          <h1 className="font-display text-5xl uppercase leading-[0.95] sm:text-6xl">{artwork.title}</h1>
          <p className="text-lg">{artwork.artist.display_name}</p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="font-mono text-2xl">
            {formatMoney(artwork.monthly_rent)} <span className="text-base text-ink-muted">/ mes</span>
          </p>
          <p className="text-sm text-ink-muted">Se renta por periodos de 3 a 6 meses, con pago mensual.</p>
        </div>

        <div className="flex flex-col gap-3">
          {contact.whatsapp && (
            <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" className={`${cta} bg-ink text-paper hover:bg-ink/85`}>
              Solicitar informes por WhatsApp
            </a>
          )}
          {contact.email && (
            <a href={contact.email} className={`${cta} ${contact.whatsapp ? "border border-ink hover:bg-paper-2" : "bg-ink text-paper hover:bg-ink/85"}`}>
              Solicitar informes por correo
            </a>
          )}
          {!contact.whatsapp && !contact.email && <p className="text-sm text-ink-muted">Pronto podrás solicitar informes desde aquí.</p>}
        </div>

        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Spec label="Medidas">{formatSize(artwork.width_cm, artwork.height_cm, artwork.depth_cm)}</Spec>
          <Spec label="Orientación">{formatOrientation(artwork.orientation)}</Spec>
          {artwork.technique && <Spec label="Técnica">{artwork.technique}</Spec>}
          {artwork.year && <Spec label="Año">{artwork.year}</Spec>}
          {artwork.dominant_palette.length > 0 && <Spec label="Paleta">{artwork.dominant_palette.join(", ")}</Spec>}
          {artwork.recommended_spaces.length > 0 && <Spec label="Espacios recomendados">{artwork.recommended_spaces.join(", ")}</Spec>}
        </dl>

        <section aria-labelledby="artist-title" className="flex flex-col gap-3 border-t border-border pt-6">
          <h2 id="artist-title" className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-muted">
            Sobre el artista
          </h2>
          <p className="text-lg font-medium">
            {artwork.artist.display_name}
            {artwork.artist.city && <span className="font-normal text-ink-muted"> · {artwork.artist.city}</span>}
          </p>
          {artwork.artist.bio && <p className="whitespace-pre-line">{artwork.artist.bio}</p>}
          {artwork.artist.statement && <p className="whitespace-pre-line text-ink-muted">{artwork.artist.statement}</p>}
          {instagram && (
            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs uppercase tracking-[0.14em] underline underline-offset-8"
            >
              @{instagram}
            </a>
          )}
        </section>
      </div>
    </main>
  )
}

export default function ArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-7xl px-5 py-16 font-mono text-xs uppercase tracking-[0.14em] text-ink-muted sm:px-8">Cargando obra…</main>}>
      <ArtworkDetail params={params} />
    </Suspense>
  )
}
