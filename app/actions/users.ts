"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

export interface CreateUserData {
  email: string
  password: string
  fullName: string
  role: "admin" | "editor" | "visualizador"
}

export interface UpdateUserData {
  userId: string
  email: string
  fullName: string
  role: "admin" | "editor" | "visualizador"
  newPassword?: string
}

export interface ActionResponse {
  success: boolean
  error?: string
  message?: string
}

export async function createUser(data: CreateUserData): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Verificar se o usuário atual é admin
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single()

    if (!currentProfile || currentProfile.role !== "admin") {
      return { success: false, error: "Apenas administradores podem criar usuários" }
    }

    // Validar dados
    if (!data.email || !data.password || !data.fullName) {
      return { success: false, error: "Todos os campos são obrigatórios" }
    }

    if (data.password.length < 6) {
      return { success: false, error: "A senha deve ter no mínimo 6 caracteres" }
    }

    if (!["admin", "editor", "visualizador"].includes(data.role)) {
      return { success: false, error: "Role inválida" }
    }

    // Criar cliente admin com service role
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    )

    // Criar usuário no auth.users usando a admin API
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Confirma o email automaticamente
      user_metadata: {
        full_name: data.fullName,
        role: data.role, // Adiciona role ao metadata para o trigger
      },
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    if (!newUser.user) {
      return { success: false, error: "Erro ao criar usuário" }
    }

    // O profile é criado automaticamente pelo trigger handle_new_user
    // Não é necessário inserir manualmente

    // Revalidar a página para atualizar a lista
    revalidatePath("/configuracoes/usuarios")

    return {
      success: true,
      message: "Usuário criado com sucesso!",
    }
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return {
      success: false,
      error: "Erro inesperado ao criar usuário",
    }
  }
}

export async function updateUser(data: UpdateUserData): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Verificar se o usuário atual é admin
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single()

    if (!currentProfile || currentProfile.role !== "admin") {
      return { success: false, error: "Apenas administradores podem editar usuários" }
    }

    // Validar dados
    if (!data.email || !data.fullName || !data.userId) {
      return { success: false, error: "Todos os campos são obrigatórios" }
    }

    if (!["admin", "editor", "visualizador"].includes(data.role)) {
      return { success: false, error: "Role inválida" }
    }

    if (data.newPassword && data.newPassword.length < 6) {
      return { success: false, error: "A senha deve ter no mínimo 6 caracteres" }
    }

    // Criar cliente admin com service role
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    )

    // Atualizar dados do usuário no auth (email e senha se fornecida)
    const updateData: any = {
      email: data.email,
      user_metadata: {
        full_name: data.fullName,
        role: data.role,
      },
    }

    if (data.newPassword) {
      updateData.password = data.newPassword
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      data.userId,
      updateData
    )

    if (authError) {
      return { success: false, error: authError.message }
    }

    // Atualizar profile na tabela profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.fullName,
        email: data.email,
        role: data.role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.userId)

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    // Revalidar a página para atualizar a lista
    revalidatePath("/configuracoes/usuarios")

    return {
      success: true,
      message: "Usuário atualizado com sucesso!",
    }
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    return {
      success: false,
      error: "Erro inesperado ao atualizar usuário",
    }
  }
}

export async function deleteUser(userId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Verificar se o usuário atual é admin
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single()

    if (!currentProfile || currentProfile.role !== "admin") {
      return { success: false, error: "Apenas administradores podem excluir usuários" }
    }

    // Validar que não está tentando excluir a si mesmo
    if (userId === currentUser.id) {
      return { success: false, error: "Você não pode excluir seu próprio usuário" }
    }

    // Criar cliente admin com service role
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    )

    // Primeiro, excluir o profile (o auth.users será excluído em cascata ou precisamos fazer manualmente)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId)

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    // Excluir o usuário da autenticação
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      return { success: false, error: authError.message }
    }

    // Revalidar a página para atualizar a lista
    revalidatePath("/configuracoes/usuarios")

    return {
      success: true,
      message: "Usuário excluído com sucesso!",
    }
  } catch (error) {
    console.error("Erro ao excluir usuário:", error)
    return {
      success: false,
      error: "Erro inesperado ao excluir usuário",
    }
  }
}
