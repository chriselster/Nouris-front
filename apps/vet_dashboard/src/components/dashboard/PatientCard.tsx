import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Pet } from '@/types/supabase'

interface PatientCardProps {
    pet: Pet
    isSelected: boolean
    onClick: () => void
}

const statusConfig = {
    active: { label: 'Ativo', variant: 'success' as const },
    inactive: { label: 'Inativo', variant: 'secondary' as const },
    pending: { label: 'Pendente', variant: 'warning' as const },
}

export function PatientCard({ pet, isSelected, onClick }: PatientCardProps) {
    const initials = pet.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    const status = statusConfig[pet.status] ?? statusConfig.active

    return (
        <button
            onClick={onClick}
            className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent',
                isSelected && 'bg-accent'
            )}
        >
            <Avatar className="h-9 w-9 flex-shrink-0">
                {pet.photo_url && <AvatarImage src={pet.photo_url} alt={pet.name} />}
                <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-none">{pet.name}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                    {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}
                </p>
            </div>

            <Badge variant={status.variant} className="flex-shrink-0 text-[10px]">
                {status.label}
            </Badge>
        </button>
    )
}
