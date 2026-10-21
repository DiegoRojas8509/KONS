// "Solicitar informes" is a plain link (WhatsApp or e-mail): the quote request form is Sprint 2.
// Both channels are configured through env vars so they can change without touching code.
export type ContactLinks = { whatsapp: string | null; email: string | null }

export function getContactLinks(workTitle: string, artistName: string): ContactLinks {
  const message = `Hola, me interesa rentar la obra "${workTitle}" de ${artistName}. ¿Me comparten información sobre disponibilidad y periodos?`

  const phone = (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? "").replace(/\D/g, "")
  const email = (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "").trim()

  return {
    whatsapp: phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null,
    email: email ? `mailto:${email}?subject=${encodeURIComponent(`Renta de "${workTitle}"`)}&body=${encodeURIComponent(message)}` : null,
  }
}
