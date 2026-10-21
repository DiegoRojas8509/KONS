import type { ReactNode } from "react"
import { Suspense } from "react"

import { ArtistGate } from "@/components/artist/artist-gate"

export default function ArtistLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<main className="p-6 text-muted-foreground">Cargando…</main>}>
      <ArtistGate>{children}</ArtistGate>
    </Suspense>
  )
}
