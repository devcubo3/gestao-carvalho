import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UsersClient } from "@/components/users/users-client"

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string | null
  role: string
  created_at: string
  updated_at: string
}

export default async function UsuariosPage() {
  const supabase = await createClient()

  // Verificar autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Buscar perfil do usuário atual para verificar permissões
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // Verificar se o usuário tem permissão (admin ou editor)
  if (!currentUserProfile || (currentUserProfile.role !== "admin" && currentUserProfile.role !== "editor")) {
    redirect("/sem-acesso")
  }

  // Buscar todos os perfis de usuários com email
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role, created_at, updated_at")
    .order("created_at", { ascending: false })

  // Mapear os dados
  const users = profiles?.map((profile: Profile) => {
    return {
      id: profile.id,
      name: profile.full_name || "Sem nome",
      email: profile.email || "",
      role: profile.role,
      avatar: profile.avatar_url,
      lastLogin: profile.updated_at,
      createdAt: profile.created_at,
    }
  }) || []

  const isAdmin = currentUserProfile.role === "admin"

  return <UsersClient users={users} isAdmin={isAdmin} currentUserId={user.id} />
}
