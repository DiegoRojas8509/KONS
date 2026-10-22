import type { Metadata } from "next"
import Link from "next/link"

import { TERMS_VERSION } from "@/lib/constants/terms"

export const metadata: Metadata = { title: "Términos y condiciones · KONS" }

// DRAFT: pending legal review. Bump TERMS_VERSION (lib/constants/terms.ts) whenever the substance changes.
const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "Qué se renta",
    items: [
      "KONS renta colecciones completas de obra original; no se rentan ni se venden obras sueltas desde el sitio.",
      "Una Selección KONS puede ser sorpresa: el cliente conoce la portada y los atributos, y descubre el resto al recibirla.",
      "Cada obra pertenece a una sola colección a la vez. Mientras una colección está rentada o apartada, no se ofrece a otro cliente en esas fechas.",
    ],
  },
  {
    title: "Solicitud y confirmación",
    items: [
      "Enviar la solicitud aparta las fechas como “en revisión”. No es un contrato ni genera cobro.",
      "Un asesor de KONS se comunicará con el cliente para resolver dudas y acordar condiciones. KONS puede confirmar la renta o liberar las fechas.",
      "La renta queda confirmada solo cuando KONS la confirma por escrito.",
    ],
  },
  {
    title: "Planes, rotación y pagos",
    items: [
      "Los planes (Temporada, Semestre, Anual y Anual estacional) fijan la duración, el número de colecciones y la frecuencia de rotación.",
      "La solicitud aparta el primer periodo del plan; las colecciones siguientes se asignan con el asesor según su disponibilidad.",
      "El precio es mensual por colección, con el descuento del plan. Los pagos se acuerdan por mes, trimestre, semestre, año o por adelantado, según lo que permita el plan.",
      "Los precios se muestran en pesos mexicanos y pueden cambiar hasta la confirmación por escrito.",
    ],
  },
  {
    title: "Entrega, instalación y devolución",
    items: [
      "KONS coordina la entrega, la instalación y el retiro de las obras en las fechas acordadas.",
      "Al terminar el periodo, las obras se devuelven o se rotan por la siguiente colección del plan.",
      "El cliente debe permitir el acceso al espacio para la instalación y el retiro.",
    ],
  },
  {
    title: "Cuidado de la obra",
    items: [
      "El cliente se compromete a conservar las obras en el lugar indicado, sin moverlas, modificarlas, restaurarlas ni retirarlas del espacio acordado.",
      "Deben evitarse la exposición directa al sol, la humedad, el humo y los cambios bruscos de temperatura.",
      "Cualquier daño, pérdida o robo debe avisarse a KONS de inmediato.",
    ],
  },
  {
    title: "Daños y pérdida",
    items: [
      "El cliente es responsable por los daños o la pérdida de las obras durante la renta, salvo el desgaste normal por uso.",
      "KONS y el cliente acordarán por escrito el valor de reposición o reparación, y puede solicitarse un depósito o seguro.",
    ],
  },
  {
    title: "Cancelación",
    items: [
      "Mientras la solicitud esté en revisión, el cliente puede cancelarla sin costo avisando a su asesor.",
      "Las condiciones de cancelación de una renta confirmada se establecen en el acuerdo escrito.",
    ],
  },
  {
    title: "Venta de obra",
    items: ["La compra de una obra no se ofrece en el sitio. Solo puede acordarse con un asesor cuando el cliente ya tiene la obra en renta."],
  },
  {
    title: "Derechos de las obras e imagen",
    items: [
      "Las obras y sus imágenes pertenecen a sus artistas. La renta no transfiere derechos de autor.",
      "KONS puede fotografiar las obras instaladas para fines de documentación y difusión, con respeto al espacio del cliente.",
    ],
  },
  {
    title: "Datos personales",
    items: [
      "Los datos que el cliente deja en la solicitud (nombre, correo, teléfono, empresa, ciudad y mensaje) se usan para contactarlo y gestionar su renta.",
      "No se comparten con terceros ajenos a la operación del servicio.",
    ],
  },
]

export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-col gap-3">
        <Link href="/catalogo" className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted underline-offset-8 hover:underline">
          ← Colecciones
        </Link>
        <h1 className="font-display text-5xl uppercase leading-[0.95] sm:text-7xl">Términos y condiciones</h1>
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">Borrador sujeto a revisión legal · versión {TERMS_VERSION}</p>
      </div>
      {SECTIONS.map((s) => (
        <section key={s.title} className="flex flex-col gap-3 border-t border-border pt-6">
          <h2 className="text-xl font-medium">{s.title}</h2>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            {s.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
