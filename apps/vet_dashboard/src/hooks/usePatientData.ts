import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { WeightLog, FecesLog, DietPlan } from '@/types/supabase'

/**
 * Histórico de peso do pet.
 */
export function useWeightLogs(petId: string | null) {
    return useQuery({
        queryKey: ['weight_logs', petId],
        queryFn: async (): Promise<WeightLog[]> => {
            const { data, error } = await supabase
                .from('weight_logs')
                .select('*')
                .eq('pet_id', petId!)
                .order('recorded_at', { ascending: false })

            if (error) throw error
            return data
        },
        enabled: !!petId,
        staleTime: 1000 * 60 * 5,
    })
}

/**
 * Logs de fezes — filtra os pendentes de avaliação (vet_score IS NULL)
 * quando pendingOnly = true. Usado na Fila de Triagem.
 */
export function useFecesLogs(petId: string | null, pendingOnly = false) {
    return useQuery({
        queryKey: ['feces_logs', petId, pendingOnly],
        queryFn: async (): Promise<FecesLog[]> => {
            let query = supabase
                .from('feces_logs')
                .select('*')
                .order('recorded_at', { ascending: false })

            if (petId) query = query.eq('pet_id', petId)
            if (pendingOnly) query = query.is('score', null)

            const { data, error } = await query
            if (error) throw error
            return data
        },
        enabled: petId !== undefined,
        staleTime: 1000 * 60 * 2,
    })
}

/**
 * Mutação para submeter avaliação veterinária de fezes (score 1-7).
 * Após o UPDATE, invalida o cache da triagem e do histórico do pet.
 */
export function useEvaluateFeces() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ logId, score }: { logId: string; score: number }) => {
            const { error } = await supabase
                .from('feces_logs')
                .update({ score } as never)
                .eq('id', logId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feces_logs'] })
        },
    })
}

/**
 * Plano de dieta ativo do pet.
 */
export function useActiveDietPlan(petId: string | null) {
    return useQuery({
        queryKey: ['diet_plans', petId],
        queryFn: async (): Promise<DietPlan | null> => {
            const { data, error } = await supabase
                .from('diet_plans')
                .select('*')
                .eq('pet_id', petId!)
                .eq('active', true)
                .maybeSingle()

            if (error) throw error
            return data
        },
        enabled: !!petId,
        staleTime: 1000 * 60 * 5,
    })
}
