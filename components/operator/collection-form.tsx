"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createCollection, updateCollection } from "@/lib/actions/collection"
import { PALETTES, SPACES } from "@/lib/constants/artwork"
import { collectionSchema, type CollectionInput } from "@/lib/validations/collection"

export const EMPTY_COLLECTION: CollectionInput = {
  title: "",
  description: "",
  reveal: "mystery",
  spaceTypes: [],
  palette: [],
  monthlyPrice: "",
}

function Toggles({ legend, options, ...register }: { legend: string; options: readonly string[] } & ReturnType<ReturnType<typeof useForm<CollectionInput>>["register"]>) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm">
            <input type="checkbox" value={o} {...register} />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function CollectionForm({ collectionId, defaultValues = EMPTY_COLLECTION }: { collectionId?: string; defaultValues?: CollectionInput }) {
  const [feedback, setFeedback] = useState<{ error?: string; message?: string } | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CollectionInput>({ resolver: zodResolver(collectionSchema), defaultValues })

  async function onSubmit(values: CollectionInput) {
    setFeedback(null)
    // Creating redirects to the editor on success; it only returns when something went wrong.
    setFeedback(collectionId ? await updateCollection(collectionId, values) : await createCollection(values))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Nombre</Label>
        <Input id="title" aria-invalid={!!errors.title} {...register("title")} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Textarea id="description" rows={3} aria-invalid={!!errors.description} {...register("description")} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Qué ve el cliente</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" value="mystery" {...register("reveal")} /> Sorpresa: solo portada y atributos
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" value="open" {...register("reveal")} /> Abierta: todas las obras
        </label>
      </fieldset>

      <Toggles legend="Espacios" options={SPACES} {...register("spaceTypes")} />
      <Toggles legend="Paleta" options={PALETTES} {...register("palette")} />

      <div className="flex max-w-xs flex-col gap-2">
        <Label htmlFor="monthlyPrice">Precio mensual (MXN)</Label>
        <Input id="monthlyPrice" inputMode="decimal" aria-invalid={!!errors.monthlyPrice} {...register("monthlyPrice")} />
        {errors.monthlyPrice && <p className="text-sm text-destructive">{errors.monthlyPrice.message}</p>}
      </div>

      {feedback?.error && (
        <p role="alert" className="text-sm text-destructive">
          {feedback.error}
        </p>
      )}
      {feedback?.message && (
        <p role="status" className="text-sm">
          {feedback.message}
        </p>
      )}
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : collectionId ? "Guardar cambios" : "Crear colección"}
        </Button>
      </div>
    </form>
  )
}
