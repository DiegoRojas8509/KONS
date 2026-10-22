// "Hablar con un asesor" is a plain link (WhatsApp or e-mail). Both channels come from env vars so they can change without code.
export type ContactLinks = { whatsapp: string | null; email: string | null }

export function getAdvisorLinks(topic?: string): ContactLinks {
  const message = topic
    ? `Hola, me interesa ${topic}. ¿Me pueden asesorar?`
    : "Hola, me interesa renovar mi espacio con arte. ¿Me pueden asesorar?"

  const phone = (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? "").replace(/\D/g, "")
  const email = (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "").trim()

  return {
    whatsapp: phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null,
    email: email ? `mailto:${email}?subject=${encodeURIComponent("Asesoría KONS")}&body=${encodeURIComponent(message)}` : null,
  }
}
