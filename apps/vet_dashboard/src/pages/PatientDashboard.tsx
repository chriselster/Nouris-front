import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MainContainer } from '@/components/dashboard/MainContainer'
import type { Pet } from '@/types/supabase'

/**
 * Layout Master-Detail:
 * - Sidebar fixa à esquerda com lista de pacientes
 * - Main panel com conteúdo do pet selecionado
 */
export default function PatientDashboard() {
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null)

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar selectedPetId={selectedPet?.id ?? null} onSelectPet={setSelectedPet} />

            <main className="flex flex-1 flex-col overflow-hidden">
                {selectedPet ? (
                    <MainContainer pet={selectedPet} />
                ) : (
                    <EmptyState />
                )}
            </main>
        </div>
    )
}

function EmptyState() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-base font-medium">Selecione um paciente</p>
            <p className="max-w-xs text-sm text-muted-foreground">
                Escolha um pet na lista à esquerda para visualizar o histórico, gráficos e plano de dieta.
            </p>
        </div>
    )
}
