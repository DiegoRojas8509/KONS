"use client"

import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  deleteArtworkImage,
  prepareImageUploads,
  registerArtworkImages,
  reorderArtworkImages,
  setPrimaryImage,
} from "@/lib/actions/artwork-images"
import { createClient } from "@/lib/supabase/client"
import type { ArtworkImageView } from "@/lib/data/artwork"
import { MAX_IMAGES_PER_ARTWORK } from "@/lib/validations/artwork-images"

type Props = { artworkId: string; images: ArtworkImageView[]; editable: boolean }

const MAX_SIDE = 2000

// Optimizes a photo in the browser before uploading: resized to MAX_SIDE and re-encoded as WebP. Phone photos of 6-10 MB
// become a few hundred KB, so they pass the size limit and the catalog loads fast. Falls back to the original file.
async function toWebp(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85))
    if (!blob || blob.type !== "image/webp") return file
    if (file.type === "image/webp" && blob.size >= file.size) return file
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" })
  } catch {
    return file
  }
}

export function ArtworkImages({ artworkId, images, editable }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const busy = uploading || pending

  async function onFilesSelected(fileList: FileList | null) {
    const picked = Array.from(fileList ?? [])
    if (picked.length === 0) return
    setError(null)
    setUploading(true)
    try {
      const files = await Promise.all(picked.map(toWebp))
      const prepared = await prepareImageUploads({
        artworkId,
        files: files.map((f) => ({ type: f.type, size: f.size })),
      })
      if ("error" in prepared) return setError(prepared.error)

      const storage = createClient().storage.from("artworks")
      const uploaded: string[] = []
      let failed = false
      for (const [i, ticket] of prepared.tickets.entries()) {
        const { error: uploadError } = await storage.uploadToSignedUrl(ticket.path, ticket.token, files[i], {
          contentType: files[i].type,
          cacheControl: "31536000", // the path is unique per upload, so the file can be cached for a year
        })
        if (uploadError) {
          failed = true
          break
        }
        uploaded.push(ticket.path)
      }

      // Record whatever did arrive, so a mid-way failure does not leave orphan files in Storage.
      if (uploaded.length > 0) {
        const registered = await registerArtworkImages({ artworkId, paths: uploaded })
        if ("error" in registered) return setError(registered.error)
        router.refresh()
      }
      if (failed) setError("No pudimos subir todas las imágenes. Revisa las que faltan y vuelve a intentarlo.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function run(action: () => Promise<{ ok: true } | { error: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if ("error" in result) setError(result.error)
      else router.refresh()
    })
  }

  function move(index: number, direction: -1 | 1) {
    const ids = images.map((i) => i.id)
    const target = index + direction
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    run(() => reorderArtworkImages({ artworkId, orderedIds: ids }))
  }

  return (
    <section aria-labelledby="images-title" className="flex flex-col gap-4">
      <h2 id="images-title" className="text-lg font-medium">
        Imágenes
      </h2>

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay imágenes.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <li key={image.id} className="flex flex-col gap-2">
              {/* Signed URLs are short-lived and per-request: the Next image optimizer adds nothing here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={`Imagen ${index + 1} de la obra`} className="aspect-[4/3] w-full rounded-md object-cover" />
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {image.isPrimary && <span className="font-medium">Principal</span>}
                {editable && (
                  <>
                    {!image.isPrimary && (
                      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => run(() => setPrimaryImage({ artworkId, imageId: image.id }))}>
                        Hacer principal
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="outline" disabled={busy || index === 0} onClick={() => move(index, -1)} aria-label="Mover antes">
                      ↑
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={busy || index === images.length - 1} onClick={() => move(index, 1)} aria-label="Mover después">
                      ↓
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => run(() => deleteArtworkImage({ artworkId, imageId: image.id }))}>
                      Eliminar
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editable && images.length < MAX_IMAGES_PER_ARTWORK && (
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            onChange={(e) => onFilesSelected(e.target.files)}
            aria-label="Agregar imágenes"
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            JPG, PNG o WebP, {MAX_IMAGES_PER_ARTWORK} por obra como máximo; se optimizan al subirlas. La primera será la principal.
          </p>
          {uploading && <p role="status" className="text-sm">Subiendo…</p>}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}
