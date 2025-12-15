import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileClient } from '@/components/account/profile-client'

export default async function MinhaContaPage() {
  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }
  
  // Buscar perfil do usuário
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (profileError) {
    console.error('Erro ao buscar perfil:', profileError)
    redirect('/login')
  }
  
  // Combinar dados de auth e profile
  const userData = {
    id: user.id,
    email: user.email!,
    fullName: profile.full_name || '',
    avatarUrl: profile.avatar_url,
    role: profile.role,
    createdAt: profile.created_at,
    lastSignInAt: user.last_sign_in_at || null,
  }
  
  return <ProfileClient userData={userData} />
}
