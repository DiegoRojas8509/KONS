import type { ReactNode } from "react"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { getCurrentArtist } from "@/lib/data/artist"

function Screen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
      <div>
        <SignOutButton />
      </div>
    </main>
  )
}

// Everything under /artista renders only for approved artists; the rest see their review status.
export async function ArtistGate({ children }: { children: ReactNode }) {
  const artist = await getCurrentArtist()

  if (!artist) {
    return (
      <Screen title="No encontramos tu perfil de artista">
        <p className="text-muted-foreground">Cierra sesión y vuelve a entrar. Si sigue igual, escríbenos.</p>
      </Screen>
    )
  }

  if (artist.status === "pending") {
    return (
      <Screen title="Tu cuenta está en revisión">
        <p className="text-muted-foreground">Gracias, {artist.display_name}. Vuelve a entrar más tarde para ver el resultado.</p>
      </Screen>
    )
  }

  if (artist.status === "rejected") {
    return (
      <Screen title="Tu solicitud no fue aprobada">
        <p className="text-muted-foreground">Este fue el motivo que dejó el equipo de revisión:</p>
        <blockquote className="border-l-2 pl-4">{artist.rejectionNote ?? "Sin motivo registrado."}</blockquote>
        <p className="text-sm text-muted-foreground">Si crees que es un error, escríbenos para aclararlo.</p>
      </Screen>
    )
  }

  return <>{children}</>
}
