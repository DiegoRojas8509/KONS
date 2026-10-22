"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { requestRental } from "@/lib/actions/rental-public"
import { FREQUENCY_LABELS, PLAN_IDS, PLANS, monthlyPriceForPlan, planSummary, type RentalPlan } from "@/lib/constants/plans"
import { formatMoney } from "@/lib/format"
import { rentalRequestSchema, type RentalRequestInput } from "@/lib/validations/rental"

const selectClass = "h-10 w-full border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ink"

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

export function RentalRequestForm({ collectionId, monthlyPrice, defaultPlan = "anual" }: { collectionId: string; monthlyPrice: number; defaultPlan?: RentalPlan }) {
  const [error, setError] = useState<string | null>(null)
  const [folio, setFolio] = useState<{ folio: string; email: string } | null>(null)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RentalRequestInput>({
    resolver: zodResolver(rentalRequestSchema),
    defaultValues: {
      collectionId,
      plan: defaultPlan,
      frequency: PLANS[defaultPlan].frequencies[0],
      startDate: "",
      clientName: "",
      email: "",
      company: "",
      phone: "",
      spaceType: "",
      city: "",
      message: "",
      acceptedTerms: false,
      website: "",
    },
  })

  const plan = (useWatch({ control, name: "plan" }) as RentalPlan | undefined) ?? defaultPlan
  const today = new Date().toISOString().slice(0, 10)

  async function onSubmit(values: RentalRequestInput) {
    setError(null)
    const result = await requestRental(values)
    if ("error" in result) setError(result.error)
    else setFolio({ folio: result.folio, email: values.email })
  }

  if (folio) {
    return (
      <div role="status" className="flex flex-col gap-2 border border-ink p-5">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">Solicitud recibida</p>
        <p className="font-display text-4xl uppercase">{folio.folio}</p>
        <p className="text-sm">Un asesor te escribirá a {folio.email}.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate aria-label="Solicitud de renta">
      <input type="hidden" {...register("collectionId")} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="plan">Plan</Label>
        <select id="plan" className={selectClass} {...register("plan")}>
          {PLAN_IDS.map((id) => (
            <option key={id} value={id}>
              {PLANS[id].label} · {planSummary(id)}
            </option>
          ))}
        </select>
        <p className="font-mono text-sm">
          {formatMoney(monthlyPriceForPlan(monthlyPrice, plan))} <span className="text-ink-muted">/ mes</span>
          {PLANS[plan].discount > 0 && <span className="text-ink-muted"> · −{Math.round(PLANS[plan].discount * 100)} %</span>}
        </p>
        <FieldError message={errors.plan?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="frequency">Pago</Label>
          <select id="frequency" className={selectClass} {...register("frequency")}>
            {PLANS[plan].frequencies.map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABELS[f]}
              </option>
            ))}
          </select>
          <FieldError message={errors.frequency?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">Fecha de inicio</Label>
          <Input id="startDate" type="date" min={today} aria-invalid={!!errors.startDate} {...register("startDate")} />
          <FieldError message={errors.startDate?.message} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="clientName">Nombre</Label>
          <Input id="clientName" autoComplete="name" aria-invalid={!!errors.clientName} {...register("clientName")} />
          <FieldError message={errors.clientName?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="company">Empresa o negocio (opcional)</Label>
          <Input id="company" autoComplete="organization" {...register("company")} />
          <FieldError message={errors.company?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Teléfono (opcional)</Label>
          <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
          <FieldError message={errors.phone?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="spaceType">Tipo de espacio (opcional)</Label>
          <Input id="spaceType" placeholder="Hotel, oficina, restaurante…" {...register("spaceType")} />
          <FieldError message={errors.spaceType?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">Ciudad (opcional)</Label>
          <Input id="city" autoComplete="address-level2" {...register("city")} />
          <FieldError message={errors.city?.message} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="message">Mensaje (opcional)</Label>
        <Textarea id="message" rows={3} {...register("message")} />
        <FieldError message={errors.message?.message} />
      </div>

      {/* Honeypot: hidden from people and assistive tech, bots tend to fill it. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Sitio web
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" {...register("acceptedTerms")} />
          <span>
            Acepto los{" "}
            <Link href="/terminos" target="_blank" className="underline underline-offset-4">
              términos y condiciones
            </Link>
          </span>
        </label>
        <FieldError message={errors.acceptedTerms?.message} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} className="h-12">
        {isSubmitting ? "Enviando…" : "Solicitar renta"}
      </Button>
    </form>
  )
}
