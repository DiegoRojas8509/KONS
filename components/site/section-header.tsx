import Link from "next/link"

// Editorial section opener: mono label, a hairline that fills the row, and an optional link.
export function SectionHeader({ title, count, href, hrefLabel }: { title: string; count?: number; href?: string; hrefLabel?: string }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="whitespace-nowrap font-mono text-xs uppercase tracking-[0.14em]">
        {title}
        {count !== undefined && <span className="text-ink-muted"> ({count})</span>}
      </h2>
      <span aria-hidden className="h-px flex-1 bg-border" />
      {href && (
        <Link href={href} className="whitespace-nowrap font-mono text-xs uppercase tracking-[0.14em] underline underline-offset-8">
          {hrefLabel ?? "Ver todo"}
        </Link>
      )}
    </div>
  )
}
