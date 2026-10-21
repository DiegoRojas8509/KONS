import type { Metadata } from "next"
import Link from "next/link"

import { GalleryForm } from "@/components/artist/gallery-form"

export const metadata: Metadata = { title: "Nueva galería · KONS" }

export default function NewGalleryPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/artista/galerias" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Mis galerías
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva galería</h1>
      </div>
      <GalleryForm />
    </main>
  )
}
