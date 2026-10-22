import { PALETTES, SPACES, type Palette, type Space } from "@/lib/constants/artwork"
import { parseMoney } from "@/lib/validations/artwork"

// The catalog lists COLLECTIONS: they are filtered by the space they fit, their palette and their monthly price.
export type CatalogFilters = {
  palettes: Palette[]
  spaces: Space[]
  priceMin?: number
  priceMax?: number
}

type SearchParams = Record<string, string | string[] | undefined>

const list = (value: string | string[] | undefined): string[] => (Array.isArray(value) ? value : value ? [value] : [])

function price(value: string | string[] | undefined): number | undefined {
  const raw = list(value)[0]
  if (raw === undefined) return undefined
  const n = parseMoney(raw)
  return n !== null && n >= 0 && n <= 10_000_000 ? n : undefined
}

// Lenient on purpose: anything malformed in the URL is ignored instead of breaking the page.
export function parseCatalogFilters(sp: SearchParams): CatalogFilters {
  return {
    palettes: PALETTES.filter((p) => list(sp.paleta).includes(p)),
    spaces: SPACES.filter((s) => list(sp.espacio).includes(s)),
    priceMin: price(sp.precio_min),
    priceMax: price(sp.precio_max),
  }
}

export const EMPTY_FILTERS: CatalogFilters = { palettes: [], spaces: [] }

export function hasActiveFilters(f: CatalogFilters): boolean {
  return f.palettes.length > 0 || f.spaces.length > 0 || f.priceMin !== undefined || f.priceMax !== undefined
}
