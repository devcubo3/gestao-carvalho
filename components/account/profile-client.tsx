'use client'

import { MainLayout } from '@/components/main-layout'
import { ProfileOverview } from './profile-overview'
import { PersonalInfoCard } from './personal-info-card'
import { ChangePasswordCard } from './change-password-card'

interface UserData {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  role: string
  createdAt: string
  lastSignInAt: string | null
}

interface ProfileClientProps {
  userData: UserData
}

export function ProfileClient({ userData }: ProfileClientProps) {
  return (
    <MainLayout
      breadcrumbs={[
        { label: 'Configurações' },
        { label: 'Minha Conta' }
      ]}
      hideSearch={true}
      hideQuickActions={true}
      hideNotifications={true}
      hideUserMenu={true}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">
            Minha Conta
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e configurações de conta
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ProfileOverview userData={userData} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <PersonalInfoCard userData={userData} />
            <ChangePasswordCard />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
