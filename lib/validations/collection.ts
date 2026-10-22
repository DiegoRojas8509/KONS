import { z } from "zod"

import { PALETTES, SPACES } from "@/lib/constants/artwork"
import { parseMoney } from "@/lib/validations/artwork"

export const collectionSchema = z.object({
  title: z.string().trim().min(2, "Escribe el nombre de la colección.").max(80, "Máximo 80 caracteres."),
  description: z.string().trim().max(600, "Máximo 600 caracteres."),
  reveal: z.enum(["mystery", "open"]),
  spaceTypes: z.array(z.enum(SPACES)),
  palette: z.array(z.enum(PALETTES)),
  monthlyPrice: z
    .string()
    .trim()
    .refine((v) => {
      const n = parseMoney(v)
      return n !== null && n > 0 && n <= 10_000_000
    }, "Precio mensual: escribe un número mayor a 0."),
})

export type CollectionInput = z.infer<typeof collectionSchema>

export function toCollectionRow(input: CollectionInput) {
  return {
    title: input.title,
    description: input.description || null,
    reveal: input.reveal,
    space_types: input.spaceTypes,
    palette: input.palette,
    monthly_price: parseMoney(input.monthlyPrice) as number,
  }
}

export const collectionStatusSchema = z.enum(["draft", "published", "retired"])

export const rentalReviewSchema = z
  .object({
    requestId: z.string().uuid(),
    decision: z.enum(["confirmed", "declined"]),
    notes: z.string().trim().max(1000, "La nota admite máximo 1000 caracteres."),
  })
  .refine((v) => v.decision === "confirmed" || v.notes.length > 0, {
    path: ["notes"],
    message: "Para liberar las fechas escribe el motivo.",
  })

export type RentalReviewInput = z.infer<typeof rentalReviewSchema>
