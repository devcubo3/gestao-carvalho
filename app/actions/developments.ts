"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Development, DevelopmentUnit } from "@/lib/types"

export interface CreateDevelopmentInput {
  name: string
  type: "predio" | "loteamento" | "chacaramento" | "condominio" | "comercial"
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city: string
  state: string
  zip_code?: string
  participation_percentage?: number
  total_units?: number
  reference_value?: number
  status?: "disponivel" | "comprometido" | "vendido"
  notes?: string
}

export interface UpdateDevelopmentInput extends CreateDevelopmentInput {
  id: string
}

export interface ActionResponse {
  success: boolean
  error?: string
  message?: string
  data?: any
}

/**
 * Buscar todos os empreendimentos
 */
export async function getDevelopments(): Promise<Development[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("developments")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching developments:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getDevelopments:", error)
    return []
  }
}

/**
 * Buscar empreendimento por ID
 */
export async function getDevelopmentById(id: string): Promise<Development | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("developments")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching development:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getDevelopmentById:", error)
    return null
  }
}

/**
 * Criar novo empreendimento
 */
export async function createDevelopment(
  input: CreateDevelopmentInput
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Verificar permissões
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || !["admin", "editor"].includes(profile.role)) {
      return {
        success: false,
        error: "Você não tem permissão para criar empreendimentos",
      }
    }

    // Validações
    if (!input.name || !input.type || !input.city || !input.state) {
      return {
        success: false,
        error: "Nome, tipo, cidade e estado são obrigatórios",
      }
    }

    if (input.state.length !== 2) {
      return {
        success: false,
        error: "Estado deve ter exatamente 2 caracteres (UF)",
      }
    }

    if (
      input.participation_percentage !== undefined &&
      (input.participation_percentage < 0 || input.participation_percentage > 100)
    ) {
      return {
        success: false,
        error: "Percentual de participação deve estar entre 0 e 100",
      }
    }

    // Gerar código automaticamente
    const { data: codeData, error: codeError } = await supabase.rpc(
      "generate_development_code"
    )

    if (codeError || !codeData) {
      return {
        success: false,
        error: "Erro ao gerar código do empreendimento",
      }
    }

    // Inserir empreendimento
    const { data, error } = await supabase
      .from("developments")
      .insert({
        code: codeData,
        name: input.name,
        type: input.type,
        street: input.street,
        number: input.number,
        complement: input.complement,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state.toUpperCase(),
        zip_code: input.zip_code,
        participation_percentage: input.participation_percentage,
        total_units: input.total_units,
        reference_value: input.reference_value,
        status: input.status || "disponivel",
        notes: input.notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating development:", error)
      return { success: false, error: "Erro ao criar empreendimento" }
    }

    revalidatePath("/banco-dados/empreendimentos")
    return {
      success: true,
      message: "Empreendimento criado com sucesso",
      data,
    }
  } catch (error) {
    console.error("Error in createDevelopment:", error)
    return { success: false, error: "Erro inesperado ao criar empreendimento" }
  }
}

/**
 * Atualizar empreendimento
 */
export async function updateDevelopment(
  input: UpdateDevelopmentInput
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Verificar permissões
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || !["admin", "editor"].includes(profile.role)) {
      return {
        success: false,
        error: "Você não tem permissão para editar empreendimentos",
      }
    }

    // Validações
    if (!input.name || !input.type || !input.city || !input.state) {
      return {
        success: false,
        error: "Nome, tipo, cidade e estado são obrigatórios",
      }
    }

    if (input.state.length !== 2) {
      return {
        success: false,
        error: "Estado deve ter exatamente 2 caracteres (UF)",
      }
    }

    if (
      input.participation_percentage !== undefined &&
      (input.participation_percentage < 0 || input.participation_percentage > 100)
    ) {
      return {
        success: false,
        error: "Percentual de participação deve estar entre 0 e 100",
      }
    }

    // Atualizar empreendimento (sem alterar o código)
    const { data, error } = await supabase
      .from("developments")
      .update({
        name: input.name,
        type: input.type,
        street: input.street,
        number: input.number,
        complement: input.complement,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state.toUpperCase(),
        zip_code: input.zip_code,
        participation_percentage: input.participation_percentage,
        total_units: input.total_units,
        reference_value: input.reference_value,
        status: input.status || "disponivel",
        notes: input.notes,
      })
      .eq("id", input.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating development:", error)
      return { success: false, error: "Erro ao atualizar empreendimento" }
    }

    revalidatePath("/banco-dados/empreendimentos")
    revalidatePath(`/banco-dados/empreendimentos/${input.id}`)
    return {
      success: true,
      message: "Empreendimento atualizado com sucesso",
      data,
    }
  } catch (error) {
    console.error("Error in updateDevelopment:", error)
    return { success: false, error: "Erro inesperado ao atualizar empreendimento" }
  }
}

/**
 * Excluir empreendimento
 */
export async function deleteDevelopment(id: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Verificar permissões (apenas admin)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return {
        success: false,
        error: "Apenas administradores podem excluir empreendimentos",
      }
    }

    // Excluir empreendimento
    const { error } = await supabase.from("developments").delete().eq("id", id)

    if (error) {
      console.error("Error deleting development:", error)
      return { success: false, error: "Erro ao excluir empreendimento" }
    }

    revalidatePath("/banco-dados/empreendimentos")
    return { success: true, message: "Empreendimento excluído com sucesso" }
  } catch (error) {
    console.error("Error in deleteDevelopment:", error)
    return { success: false, error: "Erro inesperado ao excluir empreendimento" }
  }
}

/**
 * Buscar empreendimentos com filtros
 */
export async function searchDevelopments(filters: {
  type?: string
  city?: string
  state?: string
  status?: string
}): Promise<Development[]> {
  try {
    const supabase = await createClient()

    let query = supabase.from("developments").select("*")

    if (filters.type) {
      query = query.eq("type", filters.type)
    }
    if (filters.city) {
      query = query.ilike("city", `%${filters.city}%`)
    }
    if (filters.state) {
      query = query.eq("state", filters.state)
    }
    if (filters.status) {
      query = query.eq("status", filters.status)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error searching developments:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in searchDevelopments:", error)
    return []
  }
}

/**
 * Buscar unidades de um empreendimento
 */
export async function getDevelopmentUnits(
  developmentId: string
): Promise<DevelopmentUnit[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("development_units")
      .select("*")
      .eq("development_id", developmentId)
      .order("unit_code", { ascending: true })

    if (error) {
      console.error("Error fetching development units:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getDevelopmentUnits:", error)
    return []
  }
}

/**
 * Criar unidade de empreendimento
 */
export async function createDevelopmentUnit(
  developmentId: string,
  input: {
    unit_code: string
    unit_type?: string
    floor?: string
    area?: number
    status?: "disponivel" | "reservado" | "vendido"
    reference_value?: number
    notes?: string
  }
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Verificar permissões
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || !["admin", "editor"].includes(profile.role)) {
      return {
        success: false,
        error: "Você não tem permissão para criar unidades",
      }
    }

    // Validação
    if (!input.unit_code) {
      return { success: false, error: "Código da unidade é obrigatório" }
    }

    // Inserir unidade
    const { data, error } = await supabase
      .from("development_units")
      .insert({
        development_id: developmentId,
        unit_code: input.unit_code,
        unit_type: input.unit_type,
        floor: input.floor,
        area: input.area,
        status: input.status || "disponivel",
        reference_value: input.reference_value,
        notes: input.notes,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating development unit:", error)
      return { success: false, error: "Erro ao criar unidade" }
    }

    revalidatePath(`/banco-dados/empreendimentos/${developmentId}`)
    return { success: true, message: "Unidade criada com sucesso", data }
  } catch (error) {
    console.error("Error in createDevelopmentUnit:", error)
    return { success: false, error: "Erro inesperado ao criar unidade" }
  }
}
