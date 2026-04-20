export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      ari_conversations: {
        Row: {
          concept_id: string | null
          created_at: string
          id: string
          island_id: Database["public"]["Enums"]["island_id"] | null
          message: string
          model_used: string | null
          response: string
          student_id: string
          tokens_used: number | null
        }
        Insert: {
          concept_id?: string | null
          created_at?: string
          id?: string
          island_id?: Database["public"]["Enums"]["island_id"] | null
          message: string
          model_used?: string | null
          response: string
          student_id: string
          tokens_used?: number | null
        }
        Update: {
          concept_id?: string | null
          created_at?: string
          id?: string
          island_id?: Database["public"]["Enums"]["island_id"] | null
          message?: string
          model_used?: string | null
          response?: string
          student_id?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ari_conversations_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ari_conversations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_prerequisites: {
        Row: {
          concept_id: string
          prerequisite_id: string
        }
        Insert: {
          concept_id: string
          prerequisite_id: string
        }
        Update: {
          concept_id?: string
          prerequisite_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concept_prerequisites_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_prerequisites_prerequisite_id_fkey"
            columns: ["prerequisite_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      concepts: {
        Row: {
          created_at: string
          description: string | null
          difficulty_range: number[]
          id: string
          name: string
          nap_alignment: string | null
          province_coin: string
          region_id: string
          type_distribution: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty_range: number[]
          id?: string
          name: string
          nap_alignment?: string | null
          province_coin: string
          region_id: string
          type_distribution?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty_range?: number[]
          id?: string
          name?: string
          nap_alignment?: string | null
          province_coin?: string
          region_id?: string
          type_distribution?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "concepts_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          approved: boolean
          character_id: string | null
          concept_id: string
          context_id: string | null
          correct_answer: Json
          created_at: string
          difficulty: number | null
          distractors: Json | null
          exercise_type: Database["public"]["Enums"]["exercise_type"]
          hint: string | null
          id: string
          prompt: string
          source: string
          updated_at: string
        }
        Insert: {
          approved?: boolean
          character_id?: string | null
          concept_id: string
          context_id?: string | null
          correct_answer: Json
          created_at?: string
          difficulty?: number | null
          distractors?: Json | null
          exercise_type: Database["public"]["Enums"]["exercise_type"]
          hint?: string | null
          id?: string
          prompt: string
          source?: string
          updated_at?: string
        }
        Update: {
          approved?: boolean
          character_id?: string | null
          concept_id?: string
          context_id?: string | null
          correct_answer?: Json
          created_at?: string
          difficulty?: number | null
          distractors?: Json | null
          exercise_type?: Database["public"]["Enums"]["exercise_type"]
          hint?: string | null
          id?: string
          prompt?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      islands: {
        Row: {
          created_at: string
          description: string | null
          id: Database["public"]["Enums"]["island_id"]
          name: string
          nap_alignment: string | null
          theme_color: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: Database["public"]["Enums"]["island_id"]
          name: string
          nap_alignment?: string | null
          theme_color?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: Database["public"]["Enums"]["island_id"]
          name?: string
          nap_alignment?: string | null
          theme_color?: string | null
        }
        Relationships: []
      }
      missions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          mission_type: Database["public"]["Enums"]["mission_type"]
          title: string
          xp_reward: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          mission_type: Database["public"]["Enums"]["mission_type"]
          title: string
          xp_reward?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          mission_type?: Database["public"]["Enums"]["mission_type"]
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      regions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          island_id: Database["public"]["Enums"]["island_id"]
          name: string
          order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          island_id: Database["public"]["Enums"]["island_id"]
          name: string
          order: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          island_id?: Database["public"]["Enums"]["island_id"]
          name?: string
          order?: number
        }
        Relationships: [
          {
            foreignKeyName: "regions_island_id_fkey"
            columns: ["island_id"]
            isOneToOne: false
            referencedRelation: "islands"
            referencedColumns: ["id"]
          },
        ]
      }
      student_codes: {
        Row: {
          code: string
          created_at: string
          student_id: string
        }
        Insert: {
          code: string
          created_at?: string
          student_id: string
        }
        Update: {
          code?: string
          created_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_codes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_coins: {
        Row: {
          earned_at: string
          id: string
          province: string
          student_id: string
        }
        Insert: {
          earned_at?: string
          id?: string
          province: string
          student_id: string
        }
        Update: {
          earned_at?: string
          id?: string
          province?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_coins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_concept_state: {
        Row: {
          attempts: number
          concept_id: string
          guess: number
          last_seen: string | null
          learn_rate: number
          mastery: Database["public"]["Enums"]["concept_mastery_status"]
          p_known: number
          slip: number
          student_id: string
        }
        Insert: {
          attempts?: number
          concept_id: string
          guess?: number
          last_seen?: string | null
          learn_rate?: number
          mastery?: Database["public"]["Enums"]["concept_mastery_status"]
          p_known?: number
          slip?: number
          student_id: string
        }
        Update: {
          attempts?: number
          concept_id?: string
          guess?: number
          last_seen?: string | null
          learn_rate?: number
          mastery?: Database["public"]["Enums"]["concept_mastery_status"]
          p_known?: number
          slip?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_concept_state_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_concept_state_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_exercise_attempts: {
        Row: {
          attempt_number: number | null
          created_at: string
          exercise_id: string
          hint_used: boolean
          id: string
          is_correct: boolean
          student_id: string
          time_ms: number | null
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string
          exercise_id: string
          hint_used?: boolean
          id?: string
          is_correct: boolean
          student_id: string
          time_ms?: number | null
        }
        Update: {
          attempt_number?: number | null
          created_at?: string
          exercise_id?: string
          hint_used?: boolean
          id?: string
          is_correct?: boolean
          student_id?: string
          time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_exercise_attempts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_exercise_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_levels: {
        Row: {
          level: number
          student_id: string
          title: string
          updated_at: string
          xp: number
        }
        Insert: {
          level?: number
          student_id: string
          title?: string
          updated_at?: string
          xp?: number
        }
        Update: {
          level?: number
          student_id?: string
          title?: string
          updated_at?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_levels_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_missions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          mission_id: string
          status: Database["public"]["Enums"]["mission_status"]
          student_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id: string
          status?: Database["public"]["Enums"]["mission_status"]
          student_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id?: string
          status?: Database["public"]["Enums"]["mission_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_missions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_ship_parts: {
        Row: {
          earned_at: string
          id: string
          part_type: string
          student_id: string
        }
        Insert: {
          earned_at?: string
          id?: string
          part_type: string
          student_id: string
        }
        Update: {
          earned_at?: string
          id?: string
          part_type?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_ship_parts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          avatar: string | null
          created_at: string
          date_of_birth: string | null
          grade: number | null
          has_seen_welcome: boolean
          id: string
          name: string
          parent_id: string
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          date_of_birth?: string | null
          grade?: number | null
          has_seen_welcome?: boolean
          id?: string
          name: string
          parent_id: string
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          date_of_birth?: string | null
          grade?: number | null
          has_seen_welcome?: boolean
          id?: string
          name?: string
          parent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar: string | null
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_own_student_or_parent: {
        Args: { student_id: string }
        Returns: boolean
      }
    }
    Enums: {
      concept_mastery_status:
        | "not_started"
        | "in_progress"
        | "mastered"
        | "needs_review"
      exercise_type:
        | "mcq"
        | "numeric_input"
        | "h5p_fill_blank"
        | "h5p_drag_drop"
        | "h5p_match"
        | "socioemotional_dilemma"
      island_id: "numeros" | "amigos"
      mission_status: "active" | "completed" | "expired"
      mission_type: "daily" | "weekly" | "exploratory" | "creative"
      user_role: "parent" | "admin" | "teacher"
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

export const Constants = {
  public: {
    Enums: {
      concept_mastery_status: [
        "not_started",
        "in_progress",
        "mastered",
        "needs_review",
      ],
      exercise_type: [
        "mcq",
        "numeric_input",
        "h5p_fill_blank",
        "h5p_drag_drop",
        "h5p_match",
        "socioemotional_dilemma",
      ],
      island_id: ["numeros", "amigos"],
      mission_status: ["active", "completed", "expired"],
      mission_type: ["daily", "weekly", "exploratory", "creative"],
      user_role: ["parent", "admin", "teacher"],
    },
  },
} as const