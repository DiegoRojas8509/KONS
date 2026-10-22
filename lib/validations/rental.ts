import { z } from "zod"

import { FREQUENCY_IDS, PLAN_IDS, PLANS, type PaymentFrequency, type RentalPlan } from "@/lib/constants/plans"

const optionalText = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`)

export const rentalRequestSchema = z
  .object({
    collectionId: z.string().uuid(),
    plan: z.enum(PLAN_IDS as [RentalPlan, ...RentalPlan[]], { error: "Elige un plan." }),
    frequency: z.enum(FREQUENCY_IDS as [PaymentFrequency, ...PaymentFrequency[]], { error: "Elige la frecuencia de pago." }),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elige la fecha de inicio."),
    clientName: z.string().trim().min(2, "Escribe tu nombre.").max(120, "Máximo 120 caracteres."),
    email: z.string().trim().toLowerCase().email("Escribe un correo válido.").max(254),
    company: optionalText(120),
    phone: optionalText(30),
    spaceType: optionalText(60),
    city: optionalText(80),
    message: optionalText(1000),
    acceptedTerms: z.boolean().refine((v) => v === true, "Debes aceptar los términos y condiciones."),
    // Honeypot: real people never see it, bots fill it.
    website: z.string().max(0).optional(),
  })
  .refine((v) => (PLANS[v.plan].frequencies as readonly string[]).includes(v.frequency), {
    path: ["frequency"],
    message: "Esa frecuencia de pago no está disponible para el plan elegido.",
  })

export type RentalRequestInput = z.input<typeof rentalRequestSchema>
