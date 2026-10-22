"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { reviewRental } from "@/lib/actions/rental"

export function RentalReviewForm({ requestId }: { requestId: string }) {
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function decide(decision: "confirmed" | "declined") {
    setError(null)
    if (decision === "declined" && notes.trim() === "") {
      setError("Para liberar las fechas escribe el motivo.")
      return
    }
    startTransition(async () => {
      // On success the action redirects to the inbox; it only returns when something went wrong.
      const result = await reviewRental({ requestId, decision, notes })
      setError(result.error)
    })
  }

  return (
    <section aria-labelledby="rental-review-title" className="flex flex-col gap-4 border-t pt-6">
      <h2 id="rental-review-title" className="text-lg font-medium">
        Resolver solicitud
      </h2>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Nota (obligatoria si liberas las fechas)</Label>
        <Textarea id="notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="button" disabled={pending} onClick={() => decide("confirmed")}>
          Confirmar renta
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => decide("declined")}>
          Liberar fechas
        </Button>
      </div>
    </section>
  )
}
