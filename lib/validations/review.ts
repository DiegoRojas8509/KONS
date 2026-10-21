import { z } from "zod"

export const reviewSchema = z
  .object({
    entityType: z.enum(["artist", "artwork"]),
    entityId: z.string().uuid(),
    decision: z.enum(["approved", "rejected"]),
    notes: z.string().trim().max(1000, "La nota admite máximo 1000 caracteres."),
  })
  .refine((v) => v.decision === "approved" || v.notes.length > 0, {
    path: ["notes"],
    message: "Para rechazar escribe el motivo: lo verá el artista.",
  })

export type ReviewInput = z.infer<typeof reviewSchema>
