import { AlertTriangle } from 'lucide-react'

interface AlertBannerProps {
    message?: string
}

export function AlertBanner({ message }: AlertBannerProps) {
    return (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{message ?? 'Alerta clínico: variação de peso significativa detectada.'}</span>
        </div>
    )
}
