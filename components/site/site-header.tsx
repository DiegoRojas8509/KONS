import Link from "next/link"

import { Wordmark } from "@/components/site/wordmark"

const navLink =
  "font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ink underline-offset-8 hover:underline focus-visible:underline sm:text-xs sm:tracking-[0.14em]"

// Minimal editorial nav. Wide screens: mono caps on both sides of a centered wordmark.
// Phones: wordmark on the left, every link on the right (there is no room for the split).
export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:px-8">
        <nav aria-label="Principal" className="hidden items-center gap-6 sm:flex">
          <Link href="/catalogo" className={navLink}>
            Catálogo
          </Link>
        </nav>
        <div className="order-first sm:order-none">
          <Wordmark />
        </div>
        <nav aria-label="Cuenta" className="flex items-center justify-end gap-4 sm:gap-6">
          <Link href="/catalogo" className={`${navLink} sm:hidden`}>
            Catálogo
          </Link>
          <Link href="/registro" className={navLink}>
            Soy artista
          </Link>
          <Link href="/login" className={navLink}>
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  )
}
