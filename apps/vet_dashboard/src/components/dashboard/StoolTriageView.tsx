import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFecesLogs, useEvaluateFeces } from '@/hooks/usePatientData'
import type { FecesLog } from '@/types/supabase'

interface StoolTriageViewProps {
    petId?: string
}

/**
 * Fila de Triagem: exibe fotos de fezes com vet_score IS NULL.
 * O veterinário avalia com um clique (1-7) → UPDATE no Supabase
 * → item some da fila e vai para o histórico.
 */
export function StoolTriageView({ petId }: StoolTriageViewProps) {
    const { data: pending, isLoading } = useFecesLogs(petId ?? null, true)
    const evaluate = useEvaluateFeces()
    const [evaluating, setEvaluating] = useState<string | null>(null)

    if (isLoading) return <div className="h-40 animate-pulse rounded-lg bg-muted" />

    if (!pending || pending.length === 0) {
        return (
            <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
                <span>Nenhuma avaliação pendente.</span>
            </div>
        )
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((log: FecesLog) => (
                <div key={log.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    {/* Foto */}
                    <div className="relative h-48 bg-muted">
                        {log.photo_url ? (
                            <img
                                src={log.photo_url}
                                alt="Foto de fezes"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                Sem foto
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                        <p className="text-xs text-muted-foreground">
                            {new Date(log.recorded_at).toLocaleDateString('pt-BR', {
                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                        </p>
                        {log.owner_notes && (
                            <p className="mt-1 text-xs text-foreground">{log.owner_notes}</p>
                        )}

                        {/* Score 1-7 */}
                        <div className="mt-3">
                            <p className="mb-1.5 text-xs font-medium">Escala de Bristol (1–7)</p>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5, 6, 7].map((score) => (
                                    <Button
                                        key={score}
                                        size="sm"
                                        variant="outline"
                                        disabled={evaluating === log.id}
                                        className="flex-1 p-0 text-xs"
                                        onClick={async () => {
                                            setEvaluating(log.id)
                                            await evaluate.mutateAsync({ logId: log.id, score })
                                            setEvaluating(null)
                                        }}
                                    >
                                        {score}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
