import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AlertBanner } from '@/components/dashboard/AlertBanner'
import { StoolTriageView } from '@/components/dashboard/StoolTriageView'
import { useWeightLogs, useActiveDietPlan } from '@/hooks/usePatientData'
import type { Pet } from '@/types/supabase'

interface MainContainerProps {
    pet: Pet
}

export function MainContainer({ pet }: MainContainerProps) {
    const { data: weightLogs } = useWeightLogs(pet.id)
    const { data: dietPlan } = useActiveDietPlan(pet.id)

    const hasAlert = weightLogs?.some((log) => log.flagged_alert) ?? false

    return (
        <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
            {/* Alerta clínico */}
            {hasAlert && (
                <AlertBanner message="Alerta: variação de peso significativa no histórico recente." />
            )}

            {/* Cabeçalho do pet */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{pet.name}</h1>
                <p className="text-sm text-muted-foreground">
                    {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}
                    {pet.weight_kg ? ` · ${pet.weight_kg} kg` : ''}
                    {pet.birth_date ? ` · Nascido em ${new Date(pet.birth_date).toLocaleDateString('pt-BR')}` : ''}
                </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="timeline" className="flex-1">
                <TabsList>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="graphs">Gráficos</TabsTrigger>
                    <TabsTrigger value="diet">Dieta</TabsTrigger>
                    <TabsTrigger value="triage">Triagem de Fezes</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="mt-4">
                    <TimelineTab petId={pet.id} />
                </TabsContent>

                <TabsContent value="graphs" className="mt-4">
                    <GraphsTab weightLogs={weightLogs ?? []} />
                </TabsContent>

                <TabsContent value="diet" className="mt-4">
                    <DietTab dietPlan={dietPlan ?? null} />
                </TabsContent>

                <TabsContent value="triage" className="mt-4">
                    <StoolTriageView petId={pet.id} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

// ── Sub-tabs ────────────────────────────────────────────────────────────────

function TimelineTab({ petId }: { petId: string }) {
    const { data: weightLogs, isLoading } = useWeightLogs(petId)

    if (isLoading) return <div className="h-40 animate-pulse rounded-lg bg-muted" />

    return (
        <div className="space-y-2">
            {(!weightLogs || weightLogs.length === 0) && (
                <p className="text-sm text-muted-foreground">Nenhum registro encontrado.</p>
            )}
            {weightLogs?.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                        <p className="text-sm font-medium">{log.weight_kg} kg</p>
                        <p className="text-xs text-muted-foreground">
                            {new Date(log.recorded_at).toLocaleDateString('pt-BR', {
                                day: '2-digit', month: 'short', year: 'numeric',
                            })}
                        </p>
                    </div>
                    {log.notes && <p className="max-w-xs truncate text-xs text-muted-foreground">{log.notes}</p>}
                    {log.flagged_alert && (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                            Alerta
                        </span>
                    )}
                </div>
            ))}
        </div>
    )
}

function GraphsTab(_props: { weightLogs: ReturnType<typeof useWeightLogs>['data'] }) {
    return (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Gráfico de evolução de peso — integre Recharts aqui com os dados de weight_logs.
        </div>
    )
}

function DietTab({
    dietPlan,
}: {
    dietPlan: import('@/types/supabase').DietPlan | null
}) {
    if (!dietPlan) {
        return (
            <p className="text-sm text-muted-foreground">
                Nenhum plano de dieta ativo. Use a calculadora para criar um.
            </p>
        )
    }

    return (
        <div className="space-y-3 rounded-lg border p-4">
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: 'Calorias', value: dietPlan.calories_kcal, unit: 'kcal' },
                    { label: 'Proteína', value: dietPlan.protein_g, unit: 'g' },
                    { label: 'Gordura', value: dietPlan.fat_g, unit: 'g' },
                    { label: 'Carboidratos', value: dietPlan.carbs_g, unit: 'g' },
                ].map(({ label, value, unit }) => (
                    <div key={label} className="rounded-lg bg-muted p-3 text-center">
                        <p className="text-lg font-bold">{value ?? '—'}{value ? ` ${unit}` : ''}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                ))}
            </div>
            {dietPlan.notes && (
                <p className="text-sm text-muted-foreground">{dietPlan.notes}</p>
            )}
        </div>
    )
}
