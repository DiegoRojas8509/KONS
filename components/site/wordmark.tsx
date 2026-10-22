import Link from "next/link"

// The KONS wordmark: condensed bold caps in ink. Links home.
export function Wordmark({ className = "text-3xl" }: { className?: string }) {
  return (
    <Link href="/" aria-label="KONS, inicio" className={`font-display uppercase leading-none tracking-wide ${className}`}>
      Kons
    </Link>
  )
}
