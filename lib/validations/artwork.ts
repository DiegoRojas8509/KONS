import { z } from "zod"

import { PALETTES, SPACES } from "@/lib/constants/artwork"

// Form values are strings so empty optional fields and decimal commas ("1,80") are handled in one place.
export function parseDecimal(value: string): number | null {
  const normalized = value.trim().replace(",", ".")
  if (normalized === "" || !/^\d+(\.\d+)?$/.test(normalized)) return null
  return Number(normalized)
}

const requiredPositive = (label: string, max: number) =>
  z
    .string()
    .trim()
    .refine((v) => {
      const n = parseDecimal(v)
      return n !== null && n > 0 && n <= max
    }, `${label}: escribe un número mayor a 0 (máximo ${max}).`)

const optionalPositive = (label: string, max: number) =>
  z
    .string()
    .trim()
    .refine((v) => {
      if (v === "") return true
      const n = parseDecimal(v)
      return n !== null && n > 0 && n <= max
    }, `${label}: escribe un número mayor a 0 (máximo ${max}) o déjalo vacío.`)

export const artworkSchema = z.object({
  title: z.string().trim().min(2, "Escribe el título de la obra.").max(120, "Máximo 120 caracteres."),
  technique: z.string().trim().max(80, "Máximo 80 caracteres."),
  year: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (/^\d{4}$/.test(v) && Number(v) >= 1000 && Number(v) <= new Date().getFullYear() + 1),
      "Año: escribe 4 dígitos, por ejemplo 2024.",
    ),
  widthCm: requiredPositive("Ancho", 2000),
  heightCm: requiredPositive("Alto", 2000),
  depthCm: optionalPositive("Profundidad", 1000),
  dominantPalette: z.array(z.enum(PALETTES)).max(PALETTES.length),
  recommendedSpaces: z.array(z.enum(SPACES)).max(SPACES.length),
  monthlyRent: requiredPositive("Renta mensual", 1_000_000),
  salePrice: optionalPositive("Precio de venta", 100_000_000),
  // "" = no gallery
  galleryId: z.union([z.literal(""), z.string().uuid()]),
})

export type ArtworkInput = z.infer<typeof artworkSchema>

export const artworkIdSchema = z.string().uuid()

// What must be true before an artwork can go to review. The DB already guarantees title, measurements and rent.
export function getSubmissionProblems(
  artwork: { title: string; width_cm: number; height_cm: number; monthly_rent: number },
  images: { is_primary: boolean }[],
): string[] {
  const problems: string[] = []
  if (!artwork.title.trim()) problems.push("Falta el título.")
  if (!(artwork.width_cm > 0 && artwork.height_cm > 0)) problems.push("Faltan las medidas.")
  if (!(artwork.monthly_rent > 0)) problems.push("Falta la renta mensual.")
  if (images.length === 0) problems.push("Agrega al menos una imagen.")
  else if (!images.some((i) => i.is_primary)) problems.push("Define cuál es la imagen principal.")
  return problems
}

// Orientation is NOT sent: the database derives it from the measurements.
export function toArtworkRow(input: ArtworkInput) {
  return {
    title: input.title,
    technique: input.technique || null,
    year: input.year ? Number(input.year) : null,
    width_cm: parseDecimal(input.widthCm) as number,
    height_cm: parseDecimal(input.heightCm) as number,
    depth_cm: input.depthCm ? parseDecimal(input.depthCm) : null,
    dominant_palette: input.dominantPalette,
    recommended_spaces: input.recommendedSpaces,
    monthly_rent: parseDecimal(input.monthlyRent) as number,
    sale_price: input.salePrice ? parseDecimal(input.salePrice) : null,
    gallery_id: input.galleryId || null,
  }
}
