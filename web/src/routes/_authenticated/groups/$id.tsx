import { createFileRoute } from '@tanstack/react-router'
import { GroupDetail } from '@/features/groups/group-detail'

export const Route = createFileRoute('/_authenticated/groups/$id')({
  component: GroupDetail,
})
