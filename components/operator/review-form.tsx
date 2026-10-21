"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { reviewEntity } from "@/lib/actions/review"
import type { ReviewInput } from "@/lib/validations/review"

type Props = { entityType: ReviewInput["entityType"]; entityId: string }

export function ReviewForm({ entityType, entityId }: Props) {
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function decide(decision: ReviewInput["decision"]) {
    setError(null)
    if (decision === "rejected" && notes.trim() === "") {
      setError("Para rechazar escribe el motivo: lo verá el artista.")
      return
    }
    startTransition(async () => {
      // On success the action redirects to the inbox; it only returns when something went wrong.
      const result = await reviewEntity({ entityType, entityId, decision, notes })
      setError(result.error)
    })
  }

  return (
    <section aria-labelledby="review-title" className="flex flex-col gap-4 border-t pt-6">
      <h2 id="review-title" className="text-lg font-medium">
        Resolver solicitud
      </h2>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Nota (obligatoria si rechazas)</Label>
        <Textarea id="notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="button" disabled={pending} onClick={() => decide("approved")}>
          Aprobar
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => decide("rejected")}>
          Rechazar
        </Button>
      </div>
    </section>
  )
}
