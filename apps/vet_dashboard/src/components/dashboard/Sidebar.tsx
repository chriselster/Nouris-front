import { useState } from 'react'
import { Search, PawPrint } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { PatientCard } from './PatientCard'
import { usePets, usePetsSearch } from '@/hooks/usePets'
import type { Pet } from '@/types/supabase'

interface SidebarProps {
    selectedPetId: string | null
    onSelectPet: (pet: Pet) => void
}

export function Sidebar({ selectedPetId, onSelectPet }: SidebarProps) {
    const [search, setSearch] = useState('')

    const { data: allPets, isLoading: loadingAll } = usePets()
    const { data: searchResults, isLoading: loadingSearch } = usePetsSearch(search)

    const pets = search.length > 0 ? searchResults : allPets
    const isLoading = search.length > 0 ? loadingSearch : loadingAll

    return (
        <aside className="flex h-full w-72 flex-shrink-0 flex-col border-r bg-background">
            {/* Header */}
            <div className="flex items-center gap-2 border-b px-4 py-4">
                <PawPrint className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold tracking-tight">Nouris</span>
                <span className="ml-1 text-sm text-muted-foreground">Vet</span>
            </div>

            {/* Busca */}
            <div className="px-3 py-3">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar paciente..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <Separator />

            {/* Lista de pacientes */}
            <ScrollArea className="flex-1 px-2 py-2">
                {isLoading && (
                    <div className="space-y-2 p-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                        ))}
                    </div>
                )}

                {!isLoading && (!pets || pets.length === 0) && (
                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                        {search ? 'Nenhum resultado.' : 'Nenhum paciente vinculado.'}
                    </p>
                )}

                {!isLoading && pets && pets.length > 0 && (
                    <div className="space-y-1">
                        {pets.map((pet) => (
                            <PatientCard
                                key={pet.id}
                                pet={pet}
                                isSelected={pet.id === selectedPetId}
                                onClick={() => onSelectPet(pet)}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </aside>
    )
}
