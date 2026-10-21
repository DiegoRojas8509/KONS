import type { Enums } from "@/lib/supabase/database.types"

export type UserRole = Enums<"user_role">

// Landing path per role. Clients have no account area in Sprint 1, so they go to the public home.
export function homePathForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case "operator":
      return "/operador"
    case "artist":
      return "/artista"
    default:
      return "/"
  }
}
