// Generated from the Supabase schema (generate_typescript_types). Regenerate after every migration; do not edit by hand.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      artists: {
        Row: {
          bio: string | null
          city: string | null
          commission_rate: number
          created_at: string
          display_name: string
          id: string
          instagram: string | null
          profile_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          statement: string | null
          status: Database["public"]["Enums"]["review_status"]
        }
        Insert: {
          bio?: string | null
          city?: string | null
          commission_rate?: number
          created_at?: string
          display_name: string
          id?: string
          instagram?: string | null
          profile_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          statement?: string | null
          status?: Database["public"]["Enums"]["review_status"]
        }
        Update: {
          bio?: string | null
          city?: string | null
          commission_rate?: number
          created_at?: string
          display_name?: string
          id?: string
          instagram?: string | null
          profile_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          statement?: string | null
          status?: Database["public"]["Enums"]["review_status"]
        }
        Relationships: [
          {
            foreignKeyName: "artists_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artists_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artwork_images: {
        Row: {
          artwork_id: string
          id: string
          is_primary: boolean
          position: number
          storage_path: string
        }
        Insert: {
          artwork_id: string
          id?: string
          is_primary?: boolean
          position?: number
          storage_path: string
        }
        Update: {
          artwork_id?: string
          id?: string
          is_primary?: boolean
          position?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "artwork_images_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      artworks: {
        Row: {
          artist_id: string
          created_at: string
          depth_cm: number | null
          dominant_palette: string[]
          gallery_id: string | null
          height_cm: number
          id: string
          monthly_rent: number
          orientation: Database["public"]["Enums"]["artwork_orientation"] | null
          recommended_spaces: string[]
          reviewed_at: string | null
          reviewed_by: string | null
          sale_price: number | null
          status: Database["public"]["Enums"]["artwork_status"]
          technique: string | null
          title: string
          width_cm: number
          year: number | null
        }
        Insert: {
          artist_id: string
          created_at?: string
          depth_cm?: number | null
          dominant_palette?: string[]
          gallery_id?: string | null
          height_cm: number
          id?: string
          monthly_rent: number
          orientation?: Database["public"]["Enums"]["artwork_orientation"] | null
          recommended_spaces?: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          sale_price?: number | null
          status?: Database["public"]["Enums"]["artwork_status"]
          technique?: string | null
          title: string
          width_cm: number
          year?: number | null
        }
        Update: {
          artist_id?: string
          created_at?: string
          depth_cm?: number | null
          dominant_palette?: string[]
          gallery_id?: string | null
          height_cm?: number
          id?: string
          monthly_rent?: number
          orientation?: Database["public"]["Enums"]["artwork_orientation"] | null
          recommended_spaces?: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          sale_price?: number | null
          status?: Database["public"]["Enums"]["artwork_status"]
          technique?: string | null
          title?: string
          width_cm?: number
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artworks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artworks_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artworks_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      galleries: {
        Row: {
          artist_id: string
          created_at: string
          description: string | null
          id: string
          slug: string | null
          title: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          description?: string | null
          id?: string
          slug?: string | null
          title: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          description?: string | null
          id?: string
          slug?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "galleries_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      review_logs: {
        Row: {
          created_at: string
          decision: Database["public"]["Enums"]["review_decision"]
          entity_id: string
          entity_type: Database["public"]["Enums"]["review_entity"]
          id: string
          notes: string | null
          reviewer_id: string
        }
        Insert: {
          created_at?: string
          decision: Database["public"]["Enums"]["review_decision"]
          entity_id: string
          entity_type: Database["public"]["Enums"]["review_entity"]
          id?: string
          notes?: string | null
          reviewer_id: string
        }
        Update: {
          created_at?: string
          decision?: Database["public"]["Enums"]["review_decision"]
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["review_entity"]
          id?: string
          notes?: string | null
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_logs_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      review_entity: {
        Args: {
          p_decision: Database["public"]["Enums"]["review_decision"]
          p_entity_id: string
          p_entity_type: Database["public"]["Enums"]["review_entity"]
          p_notes?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      artwork_orientation: "horizontal" | "vertical" | "square"
      artwork_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "rejected"
        | "rented"
        | "sold"
        | "retired"
      review_decision: "approved" | "rejected"
      review_entity: "artist" | "artwork"
      review_status: "pending" | "approved" | "rejected"
      user_role: "artist" | "client" | "operator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]
