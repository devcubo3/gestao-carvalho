"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Tipos
type VehicleInput = {
  code?: string
  type: string
  brand: string
  model: string
  year: number
  plate: string
  color?: string
  fuel_type?: string
  reference_value?: number
  status?: string
  notes?: string
}

// GET - Listar todos os veículos
export async function getVehicles() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado", data: null }
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return { success: false, error: error.message, data: null }
  }

  return { success: true, data, error: null }
}

// GET BY ID - Buscar veículo por ID
export async function getVehicleById(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado", data: null }
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return { success: false, error: error.message, data: null }
  }

  return { success: true, data, error: null }
}

// CREATE - Criar novo veículo
export async function createVehicle(input: VehicleInput) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  // Verificar permissão (admin ou editor)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "editor"].includes(profile.role)) {
    return { success: false, error: "Sem permissão para criar veículos" }
  }

  // Gerar código se não fornecido
  let code = input.code
  if (!code) {
    const { data: codeData } = await supabase.rpc("generate_vehicle_code")
    code = codeData
  }

  const { error } = await supabase
    .from("vehicles")
    .insert({
      ...input,
      code,
      created_by: user.id,
    })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/banco-dados/veiculos")
  return { success: true, error: null }
}

// UPDATE - Atualizar veículo
export async function updateVehicle(id: string, input: Partial<VehicleInput>) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  // Verificar permissão (admin ou editor)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "editor"].includes(profile.role)) {
    return { success: false, error: "Sem permissão para atualizar veículos" }
  }

  const { error } = await supabase
    .from("vehicles")
    .update(input)
    .eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/banco-dados/veiculos")
  return { success: true, error: null }
}

// DELETE - Deletar veículo
export async function deleteVehicle(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  // Verificar permissão (apenas admin)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Apenas administradores podem excluir veículos" }
  }

  const { error } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/banco-dados/veiculos")
  return { success: true, error: null }
}

// UPDATE STATUS - Atualizar apenas o status
export async function updateVehicleStatus(id: string, status: string) {
  return updateVehicle(id, { status })
}

// SEARCH - Buscar veículos com filtros
export async function searchVehicles(filters: {
  type?: string
  status?: string
  search?: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado", data: null }
  }

  let query = supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false })

  if (filters.type) {
    query = query.eq("type", filters.type)
  }

  if (filters.status) {
    query = query.eq("status", filters.status)
  }

  if (filters.search) {
    query = query.or(`code.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,plate.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message, data: null }
  }

  return { success: true, data, error: null }
}
