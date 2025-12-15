import { LoginForm } from '@/components/auth/login-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Se já está autenticado, redirecionar para o dashboard
  if (user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-2xl shadow-2xl border">
        {/* Logo e Título */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <Image 
                src="/logo.svg" 
                alt="GRA Empreendimentos" 
                width={40} 
                height={40}
                className="text-primary-foreground"
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Gestão Patrimonial
          </h2>
          <p className="text-muted-foreground font-medium">
            GRA Empreendimentos
          </p>
          <p className="text-sm text-muted-foreground">
            Faça login para acessar o sistema
          </p>
        </div>

        {/* Formulário de Login */}
        <div className="mt-8">
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          Sistema de Gestão Orientada a Contratos
        </div>
      </div>
    </div>
  )
}
