import { PALETTES, SPACES, type Palette, type Space } from "@/lib/constants/artwork"
import { parseDecimal } from "@/lib/validations/artwork"

export type Orientation = "horizontal" | "vertical" | "square"

export type CatalogFilters = {
  orientation?: Orientation
  widthMin?: number
  widthMax?: number
  heightMin?: number
  heightMax?: number
  palettes: Palette[]
  spaces: Space[]
  rentMin?: number
  rentMax?: number
}

type SearchParams = Record<string, string | string[] | undefined>

// URL values are Spanish; the database enum is English.
const ORIENTATION_BY_PARAM: Record<string, Orientation> = { horizontal: "horizontal", vertical: "vertical", cuadrada: "square" }
export const ORIENTATION_PARAM: Record<Orientation, string> = { horizontal: "horizontal", vertical: "vertical", square: "cuadrada" }

const list = (value: string | string[] | undefined): string[] => (Array.isArray(value) ? value : value ? [value] : [])

function number(value: string | string[] | undefined, max: number): number | undefined {
  const raw = list(value)[0]
  if (raw === undefined) return undefined
  const n = parseDecimal(raw)
  return n !== null && n >= 0 && n <= max ? n : undefined
}

// Lenient on purpose: anything malformed in the URL is ignored instead of breaking the page.
export function parseCatalogFilters(sp: SearchParams): CatalogFilters {
  const orientation = ORIENTATION_BY_PARAM[list(sp.orientacion)[0] ?? ""]
  return {
    orientation,
    widthMin: number(sp.ancho_min, 2000),
    widthMax: number(sp.ancho_max, 2000),
    heightMin: number(sp.alto_min, 2000),
    heightMax: number(sp.alto_max, 2000),
    palettes: PALETTES.filter((p) => list(sp.paleta).includes(p)),
    spaces: SPACES.filter((s) => list(sp.espacio).includes(s)),
    rentMin: number(sp.renta_min, 1_000_000),
    rentMax: number(sp.renta_max, 1_000_000),
  }
}

export function hasActiveFilters(f: CatalogFilters): boolean {
  return (
    f.orientation !== undefined ||
    [f.widthMin, f.widthMax, f.heightMin, f.heightMax, f.rentMin, f.rentMax].some((v) => v !== undefined) ||
    f.palettes.length > 0 ||
    f.spaces.length > 0
  )
}
