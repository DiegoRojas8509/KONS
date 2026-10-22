"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { publishArtistGallery } from "@/lib/actions/collection"

export function PublishGalleryButton({ galleryId }: { galleryId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null)
            // On success the action redirects to the new collection; it only returns when something went wrong.
            const result = await publishArtistGallery(galleryId)
            if ("error" in result) setError(result.error)
          })
        }
      >
        {pending ? "Creando…" : "Crear colección"}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
