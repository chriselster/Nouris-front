// Tipos gerados a partir do schema real do Supabase (atualizado após migrações).
// Para regenerar: supabase gen types typescript --project-id jjbyuvvcksvvhglocfrw > src/types/supabase.ts

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            vet_profiles: {
                Row: {
                    user_id: string
                    display_name: string | null
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['vet_profiles']['Row'], 'created_at'>
                Update: Partial<Database['public']['Tables']['vet_profiles']['Insert']>
            }
            tutor_profiles: {
                Row: {
                    user_id: string
                    display_name: string | null
                    original_display_name: string | null
                    is_deleted: boolean
                    anonymized_at: string | null
                }
                Insert: Omit<Database['public']['Tables']['tutor_profiles']['Row'], never>
                Update: Partial<Database['public']['Tables']['tutor_profiles']['Insert']>
            }
            pets: {
                Row: {
                    id: string
                    created_at: string
                    tutor_user_id: string
                    name: string
                    species: string
                    breed: string | null
                    birth_date: string | null
                    weight_kg: number | null
                    vet_id: string | null
                    status: 'active' | 'inactive' | 'pending'
                    photo_url: string | null
                }
                Insert: Omit<Database['public']['Tables']['pets']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['pets']['Insert']>
            }
            weight_logs: {
                Row: {
                    id: string
                    recorded_at: string
                    pet_id: string
                    tutor_user_id: string
                    weight_kg: number
                    flagged_alert: boolean
                    notes: string | null
                }
                Insert: Omit<Database['public']['Tables']['weight_logs']['Row'], 'id' | 'recorded_at'>
                Update: Partial<Database['public']['Tables']['weight_logs']['Insert']>
            }
            feces_logs: {
                Row: {
                    id: string
                    recorded_at: string
                    pet_id: string
                    tutor_user_id: string
                    consistency: string
                    score: number | null
                    notes: string | null
                    photo_url: string | null
                    owner_notes: string | null
                    vet_notes: string | null
                }
                Insert: Omit<Database['public']['Tables']['feces_logs']['Row'], 'id' | 'recorded_at'>
                Update: Partial<Database['public']['Tables']['feces_logs']['Insert']>
            }
            diet_plans: {
                Row: {
                    id: string
                    created_at: string
                    pet_id: string
                    vet_id: string
                    ingredients: Json
                    calories_kcal: number | null
                    protein_g: number | null
                    fat_g: number | null
                    carbs_g: number | null
                    notes: string | null
                    active: boolean
                }
                Insert: Omit<Database['public']['Tables']['diet_plans']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['diet_plans']['Insert']>
            }
        }
        Views: { [_ in never]: never }
        Functions: { [_ in never]: never }
        Enums: { [_ in never]: never }
    }
}

// Aliases convenientes
export type Pet = Database['public']['Tables']['pets']['Row']
export type WeightLog = Database['public']['Tables']['weight_logs']['Row']
export type FecesLog = Database['public']['Tables']['feces_logs']['Row']
export type DietPlan = Database['public']['Tables']['diet_plans']['Row']
export type VetProfile = Database['public']['Tables']['vet_profiles']['Row']

