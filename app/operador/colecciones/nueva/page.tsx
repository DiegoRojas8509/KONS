import type { Metadata } from "next"
import Link from "next/link"

import { CollectionForm } from "@/components/operator/collection-form"

export const metadata: Metadata = { title: "Nueva colección · KONS" }

export default function NewCollectionPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/operador/colecciones" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Colecciones
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva Selección KONS</h1>
      </div>
      <CollectionForm />
    </main>
  )
}
