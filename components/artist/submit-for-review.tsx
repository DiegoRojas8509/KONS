"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { submitArtworkForReview } from "@/lib/actions/artwork"

export function SubmitForReview({ artworkId, problems }: { artworkId: string; problems: string[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await submitArtworkForReview(artworkId)
      if ("error" in result) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <section aria-labelledby="submit-title" className="flex flex-col gap-3 border-t pt-6">
      <h2 id="submit-title" className="text-lg font-medium">
        Enviar a revisión
      </h2>
      <p className="text-sm text-muted-foreground">
        Guarda tus cambios antes de enviar. Una vez enviada, la obra no se puede editar hasta que el equipo la revise.
      </p>
      {problems.length > 0 && (
        <ul className="list-disc pl-5 text-sm">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div>
        <Button type="button" onClick={submit} disabled={pending || problems.length > 0}>
          {pending ? "Enviando…" : "Enviar a revisión"}
        </Button>
      </div>
    </section>
  )
}
