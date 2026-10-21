import Link from "next/link"

const navLink =
  "font-mono text-xs uppercase tracking-[0.14em] text-ink underline-offset-8 hover:underline focus-visible:underline"

// Minimal editorial nav: mono caps on both sides of a centered wordmark.
export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-5 sm:px-8">
        <nav aria-label="Principal" className="flex items-center gap-6">
          <Link href="/catalogo" className={navLink}>
            Catálogo
          </Link>
        </nav>
        <Link href="/" aria-label="KONS, inicio" className="font-display text-3xl uppercase leading-none tracking-wide">
          Kons
        </Link>
        <nav aria-label="Cuenta" className="flex items-center justify-end gap-5 sm:gap-6">
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
