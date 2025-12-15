import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"
import Link from "next/link"

export default function SemAcessoPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="font-serif text-2xl">Acesso Negado</CardTitle>
          <CardDescription className="text-base">
            Você não tem permissão para acessar esta área
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Esta página está disponível apenas para usuários com perfil de{" "}
            <span className="font-semibold text-foreground">Editor</span> ou{" "}
            <span className="font-semibold text-foreground">Administrador</span>.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Caso precise de acesso, entre em contato com um administrador do sistema.
          </p>
          <div className="flex flex-col gap-2 pt-4">
            <Button asChild className="w-full">
              <Link href="/">Voltar para Início</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/configuracoes/minha-conta">Minha Conta</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
