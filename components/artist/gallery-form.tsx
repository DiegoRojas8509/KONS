"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createGallery, updateGallery } from "@/lib/actions/gallery"
import { gallerySchema, type GalleryInput } from "@/lib/validations/gallery"

type Props = { galleryId?: string; defaultValues?: GalleryInput }

export function GalleryForm({ galleryId, defaultValues = { title: "", description: "" } }: Props) {
  const [feedback, setFeedback] = useState<{ error?: string; message?: string } | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GalleryInput>({ resolver: zodResolver(gallerySchema), defaultValues })

  async function onSubmit(values: GalleryInput) {
    setFeedback(null)
    // Creating redirects to the list on success; it only returns when something went wrong.
    setFeedback(galleryId ? await updateGallery(galleryId, values) : await createGallery(values))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" aria-invalid={!!errors.title} {...register("title")} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Textarea id="description" rows={4} aria-invalid={!!errors.description} {...register("description")} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
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
          {isSubmitting ? "Guardando…" : galleryId ? "Guardar cambios" : "Crear galería"}
        </Button>
      </div>
    </form>
  )
}
