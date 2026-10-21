import { z } from "zod"

const INSTAGRAM_PATTERN = /^(?:https?:\/\/(?:www\.)?instagram\.com\/)?@?([A-Za-z0-9._]{1,30})\/?$/

export const artistProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Escribe tu nombre artístico.").max(80, "Máximo 80 caracteres."),
  bio: z.string().trim().max(1000, "Máximo 1000 caracteres."),
  statement: z.string().trim().max(2000, "Máximo 2000 caracteres."),
  city: z.string().trim().max(80, "Máximo 80 caracteres."),
  instagram: z
    .string()
    .trim()
    .max(100)
    .refine((v) => v === "" || INSTAGRAM_PATTERN.test(v), "Escribe tu usuario de Instagram, por ejemplo @tuusuario."),
})

export type ArtistProfileInput = z.infer<typeof artistProfileSchema>

// Empty strings become null; Instagram is stored as the bare username.
export function toArtistProfileRow(input: ArtistProfileInput) {
  return {
    display_name: input.displayName,
    bio: input.bio || null,
    statement: input.statement || null,
    city: input.city || null,
    instagram: input.instagram ? (INSTAGRAM_PATTERN.exec(input.instagram)?.[1] ?? null) : null,
  }
}
