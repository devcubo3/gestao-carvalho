'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Camera, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl: string | null
  userName: string
}

export function AvatarUpload({ userId, currentAvatarUrl, userName }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload.')
      }

      const file = event.target.files[0]
      
      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB.')
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo deve ser uma imagem.')
      }

      // Fazer upload
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/avatar.${fileExt}`

      // Deletar avatar antigo se existir
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').slice(-2).join('/')
        await supabase.storage.from('avatars').remove([oldPath])
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Atualizar perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setAvatarUrl(data.publicUrl)
      toast({
        title: 'Avatar atualizado!',
        description: 'Sua foto de perfil foi atualizada com sucesso.',
      })
      
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer upload',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="relative">
      <Avatar className="h-20 w-20">
        <AvatarImage 
          src={avatarUrl || undefined} 
          alt={userName}
          className="object-cover"
        />
        <AvatarFallback className="text-lg">
          {getInitials(userName)}
        </AvatarFallback>
      </Avatar>
      <Button
        size="icon"
        variant="outline"
        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background"
        disabled={uploading}
        onClick={() => document.getElementById('avatar-upload')?.click()}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </Button>
      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={uploadAvatar}
        disabled={uploading}
        className="hidden"
      />
    </div>
  )
}
