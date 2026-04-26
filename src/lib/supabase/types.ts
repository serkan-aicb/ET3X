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
      admin_codes: {
        Row: {
          code: string
          purpose: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          code: string
          purpose?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          code?: string
          purpose?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          username: string
          did: string
          email_ciphertext: string
          email_digest: string
          created_at: string
          updated_at: string
          matriculation_number: string | null
          real_name: string | null
          headline: string | null
          bio: string | null
          avatar_url: string | null
          public_slug: string | null
        }
        Insert: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          username: string
          did: string
          email_ciphertext: string
          email_digest: string
          created_at?: string
          updated_at?: string
          matriculation_number?: string | null
          real_name?: string | null
          headline?: string | null
          bio?: string | null
          avatar_url?: string | null
          public_slug?: string | null
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          username?: string
          did?: string
          email_ciphertext?: string
          email_digest?: string
          created_at?: string
          updated_at?: string
          matriculation_number?: string | null
          real_name?: string | null
          headline?: string | null
          bio?: string | null
          avatar_url?: string | null
          public_slug?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          id: string
          task: string
          rater: string
          rated_user: string
          skills: Json
          stars_avg: number
          xp: number
          cid: string | null
          tx_hash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task: string
          rater: string
          rated_user: string
          skills: Json
          stars_avg: number
          xp: number
          cid?: string | null
          tx_hash?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task?: string
          rater?: string
          rated_user?: string
          skills?: Json
          stars_avg?: number
          xp?: number
          cid?: string | null
          tx_hash?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_rater_fkey"
            columns: ["rater"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rated_user_fkey"
            columns: ["rated_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_task_fkey"
            columns: ["task"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      skills: {
        Row: {
          id: number
          label: string
          description: string | null
          oulu_domain: string | null
        }
        Insert: {
          id?: number
          label: string
          description?: string | null
          oulu_domain?: string | null
        }
        Update: {
          id?: number
          label?: string
          description?: string | null
          oulu_domain?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          id: string
          task: string
          submitter: string
          link: string | null
          note: string | null
          files: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          task: string
          submitter: string
          link?: string | null
          note?: string | null
          files?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          task?: string
          submitter?: string
          link?: string | null
          note?: string | null
          files?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_submitter_fkey"
            columns: ["submitter"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_task_fkey"
            columns: ["task"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      task_assignments: {
        Row: {
          id: string
          task: string
          assignee: string
          created_at: string
          assignee_username: string
          assigned_by: string | null
          assigned_at: string | null
          status: string // New status field for assignments
          submitted_at: string | null
          grade: number | null
          assignee_matriculation_number: string | null // Add assignee_matriculation_number field
        }
        Insert: {
          id?: string
          task: string
          assignee: string
          created_at?: string
          assignee_username: string
          assigned_by?: string | null
          assigned_at?: string | null
          status?: string // New status field for assignments
          submitted_at?: string | null
          grade?: number | null
          assignee_matriculation_number?: string | null // Add assignee_matriculation_number field
        }
        Update: {
          id?: string
          task?: string
          assignee?: string
          created_at?: string
          assignee_username?: string
          assigned_by?: string | null
          assigned_at?: string | null
          status?: string // New status field for assignments
          submitted_at?: string | null
          grade?: number | null
          assignee_matriculation_number?: string | null // Add assignee_matriculation_number field
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_assignee_fkey"
            columns: ["assignee"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_task_fkey"
            columns: ["task"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      task_requests: {
        Row: {
          id: string
          task: string
          applicant: string
          created_at: string
          status: Database["public"]["Enums"]["request_status"]
          applicant_username: string
          applicant_matriculation_number: string | null // Add applicant_matriculation_number field
        }
        Insert: {
          id?: string
          task: string
          applicant: string
          created_at?: string
          status?: Database["public"]["Enums"]["request_status"]
          applicant_username: string
          applicant_matriculation_number?: string | null // Add applicant_matriculation_number field
        }
        Update: {
          id?: string
          task?: string
          applicant?: string
          created_at?: string
          status?: Database["public"]["Enums"]["request_status"]
          applicant_username?: string
          applicant_matriculation_number?: string | null // Add applicant_matriculation_number field
        }
        Relationships: [
          {
            foreignKeyName: "task_requests_applicant_fkey"
            columns: ["applicant"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_task_fkey"
            columns: ["task"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          creator: string
          module: string | null
          title: string
          description: string | null
          seats: number | null
          skill_level: Database["public"]["Enums"]["skill_level"] | null
          license: Database["public"]["Enums"]["license_type"] | null
          skills: number[] | null
          due_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          share_code: string | null
          is_active: boolean | null
          is_requestable: boolean | null
          task_mode: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator: string
          module?: string | null
          title: string
          description?: string | null
          seats?: number | null
          skill_level?: Database["public"]["Enums"]["skill_level"] | null
          license?: Database["public"]["Enums"]["license_type"] | null
          skills?: number[] | null
          due_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          share_code?: string | null
          is_active?: boolean | null
          is_requestable?: boolean | null
          task_mode?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator?: string
          module?: string | null
          title?: string
          description?: string | null
          seats?: number | null
          skill_level?: Database["public"]["Enums"]["skill_level"] | null
          license?: Database["public"]["Enums"]["license_type"] | null
          skills?: number[] | null
          due_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          share_code?: string | null
          is_active?: boolean | null
          is_requestable?: boolean | null
          task_mode?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_creator_fkey"
            columns: ["creator"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      task_ratings: {
        Row: {
          id: string
          task_id: string
          rater_id: string
          rated_user_id: string
          stars_avg: number
          xp: number
          rating_session_hash: string | null
          task_id_hash: string | null
          subject_id_hash: string | null
          on_chain: boolean
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          rater_id: string
          rated_user_id: string
          stars_avg?: number
          xp?: number
          rating_session_hash?: string | null
          task_id_hash?: string | null
          subject_id_hash?: string | null
          on_chain?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          rater_id?: string
          rated_user_id?: string
          stars_avg?: number
          xp?: number
          rating_session_hash?: string | null
          task_id_hash?: string | null
          subject_id_hash?: string | null
          on_chain?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_ratings_rated_user_id_fkey"
            columns: ["rated_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_ratings_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      task_rating_skills: {
        Row: {
          id: string
          rating_id: string
          skill_id: number
          stars: number
          tx_hash: string | null
          on_chain: boolean
          created_at: string
        }
        Insert: {
          id?: string
          rating_id: string
          skill_id: number
          stars: number
          tx_hash?: string | null
          on_chain?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          rating_id?: string
          skill_id?: number
          stars?: number
          tx_hash?: string | null
          on_chain?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_rating_skills_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "task_ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_rating_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
      submission_files: {
        Row: {
          id: string
          submission: string
          file_name: string
          file_size: number
          file_type: string
          storage_path: string
          created_at: string
        }
        Insert: {
          id?: string
          submission: string
          file_name: string
          file_size: number
          file_type: string
          storage_path: string
          created_at?: string
        }
        Update: {
          id?: string
          submission?: string
          file_name?: string
          file_size?: number
          file_type?: string
          storage_path?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_files_submission_fkey"
            columns: ["submission"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      license_type: "CC BY 4.0" | "CC0 1.0"
      request_status: "pending" | "accepted" | "declined"
      skill_level: "Novice" | "Skilled" | "Expert" | "Master"
      task_status: "draft" | "open" | "closed" | "in_progress" | "submitted" | "graded"
      user_role: "student" | "educator" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never