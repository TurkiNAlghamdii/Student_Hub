import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg font-medium">Confirming your email...</p>
        <p className="text-sm text-muted-foreground">Please wait while we verify your account.</p>
      </div>
    </div>
  )
} 