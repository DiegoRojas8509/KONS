import type { ReactNode } from "react"
import { Suspense } from "react"

export default function OperatorLayout({ children }: { children: ReactNode }) {
  // Pages read searchParams and cookies; the boundary lets the shell prerender.
  return <Suspense fallback={<main className="p-6 text-muted-foreground">Cargando…</main>}>{children}</Suspense>
}
