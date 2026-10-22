import { prepareImageUploads, registerArtworkImages } from "@/lib/actions/artwork-images"
import { createClient } from "@/lib/supabase/client"

const MAX_SIDE = 2000

// Optimizes a photo in the browser before uploading: resized to MAX_SIDE and re-encoded as WebP. Phone photos of 6-10 MB
// become a few hundred KB, so they pass the size limit and the catalog loads fast. Falls back to the original file.
export async function toWebp(file: File): Promise<File> {
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

export type UploadResult = { uploaded: number; error?: string }

// Optimize -> ask the server for signed upload tokens -> send the bytes straight to Storage -> record what arrived.
// Used both when creating a work (images picked in the form) and from the work's edit page.
export async function uploadArtworkImages(artworkId: string, picked: File[]): Promise<UploadResult> {
  if (picked.length === 0) return { uploaded: 0 }
  const files = await Promise.all(picked.map(toWebp))
  const prepared = await prepareImageUploads({ artworkId, files: files.map((f) => ({ type: f.type, size: f.size })) })
  if ("error" in prepared) return { uploaded: 0, error: prepared.error }

  const storage = createClient().storage.from("artworks")
  const uploaded: string[] = []
  let failed = false
  for (const [i, ticket] of prepared.tickets.entries()) {
    const { error } = await storage.uploadToSignedUrl(ticket.path, ticket.token, files[i], {
      contentType: files[i].type,
      cacheControl: "31536000", // the path is unique per upload, so the file can be cached for a year
    })
    if (error) {
      failed = true
      break
    }
    uploaded.push(ticket.path)
  }

  // Record whatever did arrive, so a mid-way failure does not leave orphan files in Storage.
  if (uploaded.length > 0) {
    const registered = await registerArtworkImages({ artworkId, paths: uploaded })
    if ("error" in registered) return { uploaded: 0, error: registered.error }
  }
  return { uploaded: uploaded.length, error: failed ? "No pudimos subir todas las imágenes. Revisa las que faltan y vuelve a intentarlo." : undefined }
}
