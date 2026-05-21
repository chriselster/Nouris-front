import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Pet } from '@/types/supabase'

/**
 * Lista todos os pets vinculados ao veterinário autenticado.
 * O cache do React Query evita refetch entre navegações recentes.
 */
export function usePets() {
    return useQuery({
        queryKey: ['pets'],
        queryFn: async (): Promise<Pet[]> => {
            const { data, error } = await supabase
                .from('pets')
                .select('*')
                .order('name')

            if (error) throw error
            return data
        },
        staleTime: 1000 * 60 * 5, // 5 min — evita spinner ao navegar entre pets recentes
    })
}

/**
 * Busca um único pet pelo id.
 */
export function usePet(petId: string | null) {
    return useQuery({
        queryKey: ['pets', petId],
        queryFn: async (): Promise<Pet> => {
            const { data, error } = await supabase
                .from('pets')
                .select('*')
                .eq('id', petId!)
                .single()

            if (error) throw error
            return data
        },
        enabled: !!petId,
        staleTime: 1000 * 60 * 5,
    })
}

/**
 * Filtra pets por nome (busca local no cache quando possível).
 */
export function usePetsSearch(query: string) {
    return useQuery({
        queryKey: ['pets', 'search', query],
        queryFn: async (): Promise<Pet[]> => {
            const { data, error } = await supabase
                .from('pets')
                .select('*')
                .ilike('name', `%${query}%`)
                .order('name')

            if (error) throw error
            return data
        },
        enabled: query.length > 0,
        staleTime: 1000 * 60 * 2,
    })
}
