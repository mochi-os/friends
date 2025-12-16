import { createFileRoute } from '@tanstack/react-router'
import { Invitations } from '@/features/invitations'

export const Route = createFileRoute('/_authenticated/invitations')({
  component: Invitations,
})
