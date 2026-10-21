import type { Metadata } from "next"
import Link from "next/link"

import { SignOutButton } from "@/components/auth/sign-out-button"

export const metadata: Metadata = { title: "Panel del artista · KONS" }

const SECTIONS = [{ href: "/artista/perfil", label: "Mi perfil" }]

export default function ArtistPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Panel del artista</h1>
      <nav aria-label="Secciones" className="flex flex-col gap-2">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="underline underline-offset-4">
            {s.label}
          </Link>
        ))}
      </nav>
      <div>
        <SignOutButton />
      </div>
    </main>
  )
}
