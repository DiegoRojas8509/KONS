"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { setCollectionStatus } from "@/lib/actions/collection"

type Status = "draft" | "published" | "retired"

const ACTIONS: Record<Status, { to: Status; label: string }[]> = {
  draft: [{ to: "published", label: "Publicar" }],
  published: [
    { to: "draft", label: "Pasar a borrador" },
    { to: "retired", label: "Retirar" },
  ],
  retired: [{ to: "draft", label: "Pasar a borrador" }],
}

export function CollectionStatus({ collectionId, status }: { collectionId: string; status: Status }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function change(to: Status) {
    setError(null)
    startTransition(async () => {
      const result = await setCollectionStatus(collectionId, to)
      if ("error" in result) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {ACTIONS[status].map((a) => (
          <Button key={a.to} type="button" variant={a.to === "published" ? "default" : "outline"} disabled={pending} onClick={() => change(a.to)}>
            {a.label}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
