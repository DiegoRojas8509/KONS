// Rental plans. The same rules live in the database (private.plan_block_months / plan_allows_frequency): keep both in sync.
// `blockMonths` is the first block a request holds on the collection; the advisor assigns the following rotations by hand.
export const PLANS = {
  temporada: {
    label: "Temporada",
    months: 4,
    collections: 1,
    rotationMonths: null,
    blockMonths: 4,
    discount: 0,
    frequencies: ["monthly", "upfront"],
  },
  semestre: {
    label: "Semestre",
    months: 6,
    collections: 2,
    rotationMonths: 3,
    blockMonths: 3,
    discount: 0.05,
    frequencies: ["quarterly", "semiannual"],
  },
  anual: {
    label: "Anual",
    months: 12,
    collections: 3,
    rotationMonths: 4,
    blockMonths: 4,
    discount: 0.1,
    frequencies: ["quarterly", "semiannual", "annual"],
  },
  anual_estacional: {
    label: "Anual estacional",
    months: 12,
    collections: 4,
    rotationMonths: 3,
    blockMonths: 3,
    discount: 0.12,
    frequencies: ["quarterly", "annual"],
  },
} as const

export type RentalPlan = keyof typeof PLANS
export const PLAN_IDS = Object.keys(PLANS) as RentalPlan[]

export const FREQUENCY_LABELS = {
  monthly: "Mensual",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
  upfront: "Por adelantado",
} as const

export type PaymentFrequency = keyof typeof FREQUENCY_LABELS
export const FREQUENCY_IDS = Object.keys(FREQUENCY_LABELS) as PaymentFrequency[]

export const RENTAL_STATUS_LABELS = {
  pending: "En revisión",
  confirmed: "Confirmada",
  declined: "Liberada",
  cancelled: "Cancelada",
} as const

export function allowedFrequencies(plan: RentalPlan): readonly PaymentFrequency[] {
  return PLANS[plan].frequencies
}

// Monthly price of a collection under a plan (discount applied, rounded to whole pesos).
export function monthlyPriceForPlan(basePrice: number, plan: RentalPlan): number {
  return Math.round(basePrice * (1 - PLANS[plan].discount))
}

export function planSummary(plan: RentalPlan): string {
  const p = PLANS[plan]
  const rotation = p.rotationMonths ? `rota cada ${p.rotationMonths} meses` : "sin rotación"
  return `${p.months} meses · ${p.collections} ${p.collections === 1 ? "colección" : "colecciones"} · ${rotation}`
}

// First day after the block a request holds, for a start date (YYYY-MM-DD).
export function blockEndDate(start: string, plan: RentalPlan): string {
  const d = new Date(`${start}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + PLANS[plan].blockMonths)
  return d.toISOString().slice(0, 10)
}
