export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chapters: {
        Row: {
          created_at: string | null
          id: string
          manga_id: string
          number: number
          pages: string[] | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          manga_id: string
          number: number
          pages?: string[] | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          manga_id?: string
          number?: number
          pages?: string[] | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "mangas"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          chapter_number: number | null
          content: string
          created_at: string | null
          id: string
          manga_id: string
          text_color: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter_number?: number | null
          content: string
          created_at?: string | null
          id?: string
          manga_id: string
          text_color?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter_number?: number | null
          content?: string
          created_at?: string | null
          id?: string
          manga_id?: string
          text_color?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "mangas"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          manga_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          manga_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          manga_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "mangas"
            referencedColumns: ["id"]
          },
        ]
      }
      mangas: {
        Row: {
          artist: string | null
          author: string | null
          banner_url: string | null
          cover_url: string | null
          created_at: string | null
          genres: string[] | null
          id: string
          is_featured: boolean | null
          is_home_highlight: boolean | null
          is_weekly_highlight: boolean | null
          original_language: string | null
          rating: number | null
          slug: string
          status: Database["public"]["Enums"]["manga_status"]
          synopsis: string | null
          title: string
          type: Database["public"]["Enums"]["manga_type"]
          updated_at: string | null
          views: number | null
          year_published: number | null
        }
        Insert: {
          artist?: string | null
          author?: string | null
          banner_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          genres?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_home_highlight?: boolean | null
          is_weekly_highlight?: boolean | null
          original_language?: string | null
          rating?: number | null
          slug: string
          status?: Database["public"]["Enums"]["manga_status"]
          synopsis?: string | null
          title: string
          type?: Database["public"]["Enums"]["manga_type"]
          updated_at?: string | null
          views?: number | null
          year_published?: number | null
        }
        Update: {
          artist?: string | null
          author?: string | null
          banner_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          genres?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_home_highlight?: boolean | null
          is_weekly_highlight?: boolean | null
          original_language?: string | null
          rating?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["manga_status"]
          synopsis?: string | null
          title?: string
          type?: Database["public"]["Enums"]["manga_type"]
          updated_at?: string | null
          views?: number | null
          year_published?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          total_reading_time: number | null
          username: string | null
          vip_expires_at: string | null
          vip_tier: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          total_reading_time?: number | null
          username?: string | null
          vip_expires_at?: string | null
          vip_tier?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          total_reading_time?: number | null
          username?: string | null
          vip_expires_at?: string | null
          vip_tier?: string | null
        }
        Relationships: []
      }
      reading_history: {
        Row: {
          chapter_id: string | null
          id: string
          last_chapter_number: number | null
          last_read_at: string | null
          manga_id: string
          reading_time_seconds: number | null
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          id?: string
          last_chapter_number?: number | null
          last_read_at?: string | null
          manga_id: string
          reading_time_seconds?: number | null
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          id?: string
          last_chapter_number?: number | null
          last_read_at?: string | null
          manga_id?: string
          reading_time_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_history_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_history_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "mangas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vip_codes: {
        Row: {
          code: string
          created_at: string | null
          duration_days: number
          id: string
          is_used: boolean | null
          tier: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          duration_days?: number
          id?: string
          is_used?: boolean | null
          tier: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          duration_days?: number
          id?: string
          is_used?: boolean | null
          tier?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      manga_status: "ongoing" | "completed" | "hiatus" | "cancelled"
      manga_type: "manga" | "manhwa" | "manhua" | "novel" | "webtoon"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      manga_status: ["ongoing", "completed", "hiatus", "cancelled"],
      manga_type: ["manga", "manhwa", "manhua", "novel", "webtoon"],
    },
  },
} as const
