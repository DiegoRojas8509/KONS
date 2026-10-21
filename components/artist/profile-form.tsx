"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateArtistProfile } from "@/lib/actions/artist"
import { artistProfileSchema, type ArtistProfileInput } from "@/lib/validations/artist"

export function ProfileForm({ defaultValues }: { defaultValues: ArtistProfileInput }) {
  const [feedback, setFeedback] = useState<{ error?: string; message?: string } | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ArtistProfileInput>({ resolver: zodResolver(artistProfileSchema), defaultValues })

  async function onSubmit(values: ArtistProfileInput) {
    setFeedback(null)
    setFeedback(await updateArtistProfile(values))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">Nombre artístico</Label>
        <Input id="displayName" aria-invalid={!!errors.displayName} {...register("displayName")} />
        {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" rows={4} aria-invalid={!!errors.bio} {...register("bio")} />
        {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="statement">Declaración artística</Label>
        <Textarea id="statement" rows={6} aria-invalid={!!errors.statement} {...register("statement")} />
        {errors.statement && <p className="text-sm text-destructive">{errors.statement.message}</p>}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input id="city" aria-invalid={!!errors.city} {...register("city")} />
          {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="instagram">Instagram</Label>
          <Input id="instagram" placeholder="@tuusuario" aria-invalid={!!errors.instagram} {...register("instagram")} />
          {errors.instagram && <p className="text-sm text-destructive">{errors.instagram.message}</p>}
        </div>
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
          {isSubmitting ? "Guardando…" : "Guardar perfil"}
        </Button>
      </div>
    </form>
  )
}
