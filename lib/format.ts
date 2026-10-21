const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })

export const formatMoney = (amount: number) => money.format(amount)

const ORIENTATION_LABELS = { horizontal: "Horizontal", vertical: "Vertical", square: "Cuadrada" } as const

export const formatOrientation = (orientation: keyof typeof ORIENTATION_LABELS | null) =>
  orientation ? ORIENTATION_LABELS[orientation] : ""

// "120 × 80 cm" (depth only when the work has one)
export function formatSize(width: number, height: number, depth?: number | null): string {
  return [width, height, depth].filter((n): n is number => typeof n === "number").join(" × ") + " cm"
}
