import Link from "next/link"

import { PALETTES, SPACES } from "@/lib/constants/artwork"
import { ORIENTATION_PARAM, hasActiveFilters, type CatalogFilters } from "@/lib/validations/catalog"

const label = "font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-muted"
const field = "h-10 w-full min-w-0 border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ink"

function RangeFields({ legend, name, unit, min, max }: { legend: string; name: string; unit: string; min?: number; max?: number }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={label}>
        {legend} ({unit})
      </legend>
      <div className="flex items-center gap-2">
        <input name={`${name}_min`} inputMode="decimal" placeholder="Mín." defaultValue={min} aria-label={`${legend} mínimo`} className={field} />
        <span aria-hidden className="text-ink-muted">
          –
        </span>
        <input name={`${name}_max`} inputMode="decimal" placeholder="Máx." defaultValue={max} aria-label={`${legend} máximo`} className={field} />
      </div>
    </fieldset>
  )
}

// Server-rendered GET form: the URL is the state, so a filtered view can be shared and works without JavaScript.
function Toggles({ legend, name, options, selected }: { legend: string; name: string; options: readonly string[]; selected: readonly string[] }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={label}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option} className="cursor-pointer">
            <input type="checkbox" name={name} value={option} defaultChecked={selected.includes(option)} className="peer sr-only" />
            <span className="inline-block border border-input px-3 py-1.5 text-sm capitalize peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">
              {option}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function CatalogFiltersForm({ filters }: { filters: CatalogFilters }) {
  const active = hasActiveFilters(filters)

  return (
    <details open={active} className="group border-y border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-mono text-xs uppercase tracking-[0.14em] marker:content-none">
        <span>Filtrar por tu espacio{active ? " · activos" : ""}</span>
        <span aria-hidden className="transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <form method="get" action="/catalogo" className="flex flex-col gap-6 pb-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <fieldset className="flex flex-col gap-2">
            <legend className={label}>Orientación</legend>
            <select name="orientacion" defaultValue={filters.orientation ? ORIENTATION_PARAM[filters.orientation] : ""} className={field} aria-label="Orientación">
              <option value="">Cualquiera</option>
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
              <option value="cuadrada">Cuadrada</option>
            </select>
          </fieldset>
          <RangeFields legend="Ancho" name="ancho" unit="cm" min={filters.widthMin} max={filters.widthMax} />
          <RangeFields legend="Alto" name="alto" unit="cm" min={filters.heightMin} max={filters.heightMax} />
          <RangeFields legend="Renta mensual" name="renta" unit="MXN" min={filters.rentMin} max={filters.rentMax} />
        </div>
        <Toggles legend="Paleta" name="paleta" options={PALETTES} selected={filters.palettes} />
        <Toggles legend="Espacio" name="espacio" options={SPACES} selected={filters.spaces} />
        <div className="flex items-center gap-6">
          <button type="submit" className="h-10 bg-ink px-6 font-mono text-xs uppercase tracking-[0.14em] text-paper hover:bg-ink/85">
            Ver resultados
          </button>
          {active && (
            <Link href="/catalogo" className="font-mono text-xs uppercase tracking-[0.14em] underline underline-offset-8">
              Limpiar filtros
            </Link>
          )}
        </div>
      </form>
    </details>
  )
}
