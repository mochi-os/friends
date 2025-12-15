import { Users, UserPlus } from 'lucide-react'
import { type SidebarData } from '@mochi/common'

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: '',
      items: [
        {
          title: 'Friends',
          url: '/',
          icon: Users,
        },
        {
          title: 'Invitations',
          url: '/invitations',
          icon: UserPlus,
        },
      ],
    },
  ],
}
