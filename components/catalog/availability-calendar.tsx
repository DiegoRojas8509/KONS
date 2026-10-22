import type { Enums } from "@/lib/supabase/database.types"

type Range = { start_date: string; end_date: string; status: Enums<"rental_status"> }

const MONTH = new Intl.DateTimeFormat("es-MX", { month: "short", year: "2-digit", timeZone: "UTC" })

// Next 12 months. A month is "Ocupada" if any confirmed rental touches it, "En revisión" if only pending ones do.
// State is always written, never color-only.
export function AvailabilityCalendar({ ranges }: { ranges: Range[] }) {
  const now = new Date()
  const months = Array.from({ length: 12 }, (_, i) => {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1))
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i + 1, 1))
    const touching = ranges.filter((r) => new Date(`${r.start_date}T00:00:00Z`) < end && new Date(`${r.end_date}T00:00:00Z`) > start)
    const state = touching.some((r) => r.status === "confirmed") ? "occupied" : touching.length > 0 ? "held" : "free"
    return { label: MONTH.format(start).replace(".", ""), state }
  })

  return (
    <section aria-labelledby="availability-title" className="flex flex-col gap-3">
      <h2 id="availability-title" className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-muted">
        Disponibilidad
      </h2>
      <ul className="grid grid-cols-3 gap-px bg-border sm:grid-cols-4">
        {months.map((m) => (
          <li
            key={m.label}
            className={`flex flex-col gap-1 px-3 py-2 ${m.state === "occupied" ? "bg-ink text-paper" : m.state === "held" ? "bg-paper-2" : "bg-paper"}`}
          >
            <span className="font-mono text-xs uppercase tracking-[0.1em]">{m.label}</span>
            <span className={`text-xs ${m.state === "occupied" ? "text-paper" : "text-ink-muted"}`}>
              {m.state === "occupied" ? "Ocupada" : m.state === "held" ? "En revisión" : "Libre"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
