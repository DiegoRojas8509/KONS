import type { Metadata } from "next"
import Link from "next/link"
import { connection } from "next/server"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { countPending, listPendingArtists, listPendingArtworks } from "@/lib/data/operator"
import { countPendingRentals, listPendingRentals } from "@/lib/data/rentals-admin"
import { FREQUENCY_LABELS, PLANS } from "@/lib/constants/plans"
import { formatMoney, formatSize } from "@/lib/format"

export const metadata: Metadata = { title: "Bandeja de revisión · KONS" }

const dateFormat = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" })

type Tab = "artistas" | "obras" | "rentas"

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

// Builds a link that keeps the other inbox controls (tab, search, order) intact.
function href(params: { tab: Tab; q?: string; orden: "asc" | "desc" }) {
  const search = new URLSearchParams({ tab: params.tab, orden: params.orden })
  if (params.q) search.set("q", params.q)
  return `/operador?${search.toString()}`
}

export default async function OperatorInboxPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Always request-time: the inbox reflects live data, never a prerendered snapshot.
  await connection()
  const sp = await searchParams
  const tabParam = first(sp.tab)
  const tab: Tab = tabParam === "obras" || tabParam === "rentas" ? tabParam : "artistas"
  const orden = first(sp.orden) === "desc" ? "desc" : "asc" // oldest first: the longest-waiting request leads
  const q = first(sp.q)?.trim().slice(0, 80) || undefined

  const [counts, rentalsCount, artists, artworks, rentals] = await Promise.all([
    countPending(),
    countPendingRentals(),
    tab === "artistas" ? listPendingArtists({ q, order: orden }) : Promise.resolve([]),
    tab === "obras" ? listPendingArtworks({ q, order: orden }) : Promise.resolve([]),
    tab === "rentas" ? listPendingRentals({ q, order: orden }) : Promise.resolve([]),
  ])
  const TAB_LABELS: Record<Tab, { label: string; count: number }> = {
    artistas: { label: "Artistas pendientes", count: counts.artists },
    obras: { label: "Obras pendientes", count: counts.artworks },
    rentas: { label: "Solicitudes de renta", count: rentalsCount },
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Bandeja de revisión</h1>
        <div className="flex items-center gap-4">
          <Link href="/operador/colecciones" className="text-sm underline underline-offset-4">
            Colecciones
          </Link>
          <SignOutButton />
        </div>
      </div>

      <nav aria-label="Pestañas de la bandeja" className="flex gap-6 border-b">
        {(["artistas", "obras", "rentas"] as const).map((t) => (
          <Link
            key={t}
            href={href({ tab: t, q, orden })}
            aria-current={tab === t ? "page" : undefined}
            className={`-mb-px border-b-2 pb-2 text-sm ${tab === t ? "border-foreground font-medium" : "border-transparent text-muted-foreground"}`}
          >
            {TAB_LABELS[t].label} ({TAB_LABELS[t].count})
          </Link>
        ))}
      </nav>

      <form method="get" className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="tab" value={tab} />
        <input type="hidden" name="orden" value={orden} />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={tab === "artistas" ? "Buscar por nombre artístico" : tab === "obras" ? "Buscar por título" : "Buscar por cliente"}
          aria-label="Buscar"
          className="h-9 min-w-0 flex-1 rounded-md border bg-transparent px-3 text-sm"
        />
        <button type="submit" className="h-9 rounded-md border px-3 text-sm">
          Buscar
        </button>
        <Link href={href({ tab, q, orden: orden === "asc" ? "desc" : "asc" })} className="text-sm underline underline-offset-4">
          Orden: {orden === "asc" ? "más antiguas primero" : "más recientes primero"}
        </Link>
      </form>

      {tab === "rentas" ? (
        rentals.length === 0 ? (
          <p className="text-muted-foreground">{q ? "Sin resultados." : "No hay solicitudes de renta pendientes."}</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {rentals.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 py-4">
                <Link href={`/operador/rentas/${r.id}`} className="font-medium underline underline-offset-4">
                  {r.client_name}
                  {r.company ? ` · ${r.company}` : ""}
                </Link>
                <p className="font-mono text-xs text-muted-foreground">
                  {r.collection?.title ?? "—"} · {PLANS[r.plan].label} · {FREQUENCY_LABELS[r.payment_frequency]} · desde el{" "}
                  {r.start_date} · {r.folio} · {dateFormat.format(new Date(r.created_at))}
                </p>
              </li>
            ))}
          </ul>
        )
      ) : tab === "artistas" ? (
        artists.length === 0 ? (
          <p className="text-muted-foreground">{q ? "Sin resultados." : "No hay artistas pendientes."}</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {artists.map((a) => (
              <li key={a.id} className="flex flex-col gap-1 py-4">
                <Link href={`/operador/artistas/${a.id}`} className="font-medium underline underline-offset-4">
                  {a.display_name}
                </Link>
                <p className="font-mono text-xs text-muted-foreground">
                  {a.email ?? "sin correo"} · {a.city ?? "sin ciudad"} · solicitó el {dateFormat.format(new Date(a.created_at))}
                </p>
              </li>
            ))}
          </ul>
        )
      ) : artworks.length === 0 ? (
        <p className="text-muted-foreground">{q ? "Sin resultados." : "No hay obras pendientes."}</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {artworks.map((w) => (
            <li key={w.id} className="flex flex-col gap-1 py-4">
              <Link href={`/operador/obras/${w.id}`} className="font-medium underline underline-offset-4">
                {w.title}
              </Link>
              <p className="font-mono text-xs text-muted-foreground">
                {w.artist_name} · {formatSize(w.width_cm, w.height_cm)} · {formatMoney(w.monthly_rent)}/mes · creada el{" "}
                {dateFormat.format(new Date(w.created_at))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
