// One place for how artwork images are rendered: decoded off the main thread, lazy by default (eager + high priority
// for the first screen) and faded in so they do not pop. Signed URLs are short-lived and per-user, so the Next image
// optimizer would not help here; the files themselves are already WebP.
type Props = {
  src: string
  alt: string
  className?: string
  fit?: "cover" | "contain"
  priority?: boolean
}

export function ArtImage({ src, alt, className = "", fit = "cover", priority = false }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      className={`art-in size-full ${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
    />
  )
}
