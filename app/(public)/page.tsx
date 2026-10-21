import Link from "next/link"

// Placeholder until SCRUM-28 (editorial home).
export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-24 sm:px-8">
      <h1 className="font-display text-6xl uppercase leading-none">Renovamos tu arte</h1>
      <Link href="/catalogo" className="font-mono text-xs uppercase tracking-[0.14em] underline underline-offset-8">
        Ver el catálogo
      </Link>
    </main>
  )
}
