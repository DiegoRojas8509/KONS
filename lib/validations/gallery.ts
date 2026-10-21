import { z } from "zod"

export const gallerySchema = z.object({
  title: z.string().trim().min(2, "Escribe un título.").max(80, "Máximo 80 caracteres."),
  description: z.string().trim().max(500, "Máximo 500 caracteres."),
})

export type GalleryInput = z.infer<typeof gallerySchema>

export const galleryIdSchema = z.string().uuid()

// "Paisajes de Guanajuato" -> "paisajes-de-guanajuato"
export function slugify(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "")
  return slug || "galeria"
}
