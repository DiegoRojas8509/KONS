import { z } from "zod"

const email = z.string().trim().toLowerCase().email("Escribe un correo válido.").max(254)
const password = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña es demasiado larga.")

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Escribe tu contraseña.").max(72),
})

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Escribe tu nombre completo.")
    .max(80, "El nombre es demasiado largo."),
  email,
  password,
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
