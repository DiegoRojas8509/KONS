import type { ReviewLog } from "@/lib/data/operator"

const dateTime = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" })

export function ReviewHistory({ logs }: { logs: ReviewLog[] }) {
  if (logs.length === 0) return null
  return (
    <section aria-labelledby="history-title" className="flex flex-col gap-3 border-t pt-6">
      <h2 id="history-title" className="text-lg font-medium">
        Historial de revisión
      </h2>
      <ul className="flex flex-col gap-3">
        {logs.map((log) => (
          <li key={log.id} className="text-sm">
            <p className="font-medium">
              {log.decision === "approved" ? "Aprobada" : "Rechazada"} · {dateTime.format(new Date(log.created_at))}
            </p>
            {log.notes && <p className="text-muted-foreground">{log.notes}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}
