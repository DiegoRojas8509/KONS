import { z } from "zod"

export const MAX_IMAGES_PER_ARTWORK = 8
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const

export type AllowedImageType = keyof typeof IMAGE_EXTENSIONS

const uuid = z.string().uuid()

export const uploadRequestSchema = z.object({
  artworkId: uuid,
  files: z
    .array(
      z.object({
        type: z.enum(["image/jpeg", "image/png", "image/webp"], { error: "Solo se aceptan imágenes JPG, PNG o WebP." }),
        size: z
          .number()
          .int()
          .positive("El archivo está vacío.")
          .max(MAX_IMAGE_BYTES, "Cada imagen debe pesar máximo 5 MB."),
      }),
    )
    .min(1, "Selecciona al menos una imagen.")
    .max(MAX_IMAGES_PER_ARTWORK, `Máximo ${MAX_IMAGES_PER_ARTWORK} imágenes por obra.`),
})

export const registerImagesSchema = z.object({
  artworkId: uuid,
  paths: z.array(z.string()).min(1).max(MAX_IMAGES_PER_ARTWORK),
})

export const imageRefSchema = z.object({ artworkId: uuid, imageId: uuid })
export const reorderSchema = z.object({ artworkId: uuid, orderedIds: z.array(uuid).min(1).max(MAX_IMAGES_PER_ARTWORK) })

// <artist_id>/<artwork_id>/<uuid>.<ext>
export function storagePathFor(artistId: string, artworkId: string, type: AllowedImageType): string {
  return `${artistId}/${artworkId}/${crypto.randomUUID()}.${IMAGE_EXTENSIONS[type]}`
}

export function isOwnedImagePath(path: string, artistId: string, artworkId: string): boolean {
  const pattern = new RegExp(`^${artistId}/${artworkId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`)
  return pattern.test(path)
}
