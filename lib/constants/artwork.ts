// Controlled vocabularies for the catalog filters: they are thought from who decorates the space, not from art history.
// Stored as text[] in artworks.dominant_palette / recommended_spaces (the DB does not constrain them; Zod does).
export const PALETTES = [
  "tierra",
  "ocre",
  "cálidos",
  "fríos",
  "neutros",
  "blanco y negro",
  "vibrantes",
  "pasteles",
  "verdes",
  "azules",
] as const

export const SPACES = [
  "lobby",
  "recepción",
  "sala",
  "comedor",
  "pasillo",
  "oficina",
  "sala de juntas",
  "habitación",
  "restaurante",
  "terraza",
] as const

export const TECHNIQUE_SUGGESTIONS = ["Óleo", "Acrílico", "Técnica mixta", "Acuarela", "Fotografía", "Grabado", "Escultura"]

export type Palette = (typeof PALETTES)[number]
export type Space = (typeof SPACES)[number]

export const ARTWORK_STATUS_LABELS = {
  draft: "Borrador",
  pending_review: "En revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
  rented: "Rentada",
  sold: "Vendida",
  retired: "Retirada",
} as const
