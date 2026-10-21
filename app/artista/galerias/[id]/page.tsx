import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { GalleryForm } from "@/components/artist/gallery-form"
import { getGallery } from "@/lib/data/gallery"
import { galleryIdSchema } from "@/lib/validations/gallery"

export const metadata: Metadata = { title: "Editar galería · KONS" }

export default async function EditGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!galleryIdSchema.safeParse(id).success) notFound()
  const gallery = await getGallery(id)
  if (!gallery) notFound()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/artista/galerias" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Mis galerías
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Editar galería</h1>
      </div>
      <GalleryForm galleryId={gallery.id} defaultValues={{ title: gallery.title, description: gallery.description ?? "" }} />
    </main>
  )
}
