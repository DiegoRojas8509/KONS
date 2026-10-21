"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createArtwork, updateArtwork } from "@/lib/actions/artwork"
import { PALETTES, SPACES, TECHNIQUE_SUGGESTIONS } from "@/lib/constants/artwork"
import { artworkSchema, type ArtworkInput } from "@/lib/validations/artwork"

export const EMPTY_ARTWORK: ArtworkInput = {
  title: "",
  technique: "",
  year: "",
  widthCm: "",
  heightCm: "",
  depthCm: "",
  dominantPalette: [],
  recommendedSpaces: [],
  monthlyRent: "",
  salePrice: "",
  galleryId: "",
}

type Props = {
  artworkId?: string
  defaultValues?: ArtworkInput
  galleries: { id: string; title: string }[]
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

export function ArtworkForm({ artworkId, defaultValues = EMPTY_ARTWORK, galleries }: Props) {
  const [feedback, setFeedback] = useState<{ error?: string; message?: string } | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ArtworkInput>({ resolver: zodResolver(artworkSchema), defaultValues })

  async function onSubmit(values: ArtworkInput) {
    setFeedback(null)
    // Creating redirects to the edit page on success; it only returns when something went wrong.
    setFeedback(artworkId ? await updateArtwork(artworkId, values) : await createArtwork(values))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" aria-invalid={!!errors.title} {...register("title")} />
        <FieldError message={errors.title?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="technique">Técnica</Label>
          <Input id="technique" list="technique-options" aria-invalid={!!errors.technique} {...register("technique")} />
          <datalist id="technique-options">
            {TECHNIQUE_SUGGESTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <FieldError message={errors.technique?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="year">Año</Label>
          <Input id="year" inputMode="numeric" placeholder="2024" aria-invalid={!!errors.year} {...register("year")} />
          <FieldError message={errors.year?.message} />
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Medidas (cm)</legend>
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="widthCm">Ancho</Label>
            <Input id="widthCm" inputMode="decimal" aria-invalid={!!errors.widthCm} {...register("widthCm")} />
            <FieldError message={errors.widthCm?.message} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="heightCm">Alto</Label>
            <Input id="heightCm" inputMode="decimal" aria-invalid={!!errors.heightCm} {...register("heightCm")} />
            <FieldError message={errors.heightCm?.message} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="depthCm">Profundidad (opcional)</Label>
            <Input id="depthCm" inputMode="decimal" aria-invalid={!!errors.depthCm} {...register("depthCm")} />
            <FieldError message={errors.depthCm?.message} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">La orientación (horizontal, vertical o cuadrada) se calcula sola.</p>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Paleta dominante</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {PALETTES.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm">
              <input type="checkbox" value={p} {...register("dominantPalette")} />
              {p}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Espacios recomendados</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {SPACES.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <input type="checkbox" value={s} {...register("recommendedSpaces")} />
              {s}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="monthlyRent">Renta mensual (MXN)</Label>
          <Input id="monthlyRent" inputMode="decimal" aria-invalid={!!errors.monthlyRent} {...register("monthlyRent")} />
          <FieldError message={errors.monthlyRent?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="salePrice">Precio de venta (opcional)</Label>
          <Input id="salePrice" inputMode="decimal" aria-invalid={!!errors.salePrice} {...register("salePrice")} />
          <FieldError message={errors.salePrice?.message} />
        </div>
      </div>

      {galleries.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="galleryId">Galería (opcional)</Label>
          <select
            id="galleryId"
            className="h-9 rounded-md border bg-transparent px-3 text-sm"
            {...register("galleryId")}
          >
            <option value="">Sin galería</option>
            {galleries.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
      )}

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
          {isSubmitting ? "Guardando…" : artworkId ? "Guardar cambios" : "Crear obra"}
        </Button>
      </div>
    </form>
  )
}
