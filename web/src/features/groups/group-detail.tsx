import { useState, useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import { User, UsersRound, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  useGroupQuery,
  useRemoveGroupMemberMutation,
} from '@/hooks/useGroups'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@mochi/common'
import { Button } from '@mochi/common'
import { Main } from '@mochi/common'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@mochi/common'
import { useSidebarContext } from '@/context/sidebar-context'

export function GroupDetail() {
  const { id } = useParams({ from: '/_authenticated/groups/$id' })
  const { data, isLoading, isError, error } = useGroupQuery(id)
  const removeMemberMutation = useRemoveGroupMemberMutation()
  const { setGroupId } = useSidebarContext()

  usePageTitle(data?.group?.name ?? 'Group')

  // Register with sidebar context
  useEffect(() => {
    setGroupId(id)
    return () => setGroupId(null)
  }, [id, setGroupId])

  const [removeMemberDialog, setRemoveMemberDialog] = useState<{
    open: boolean
    member: string
    name: string
    type: 'user' | 'group'
  }>({ open: false, member: '', name: '', type: 'user' })

  const handleRemoveMember = (member: string, name: string, type: 'user' | 'group') => {
    setRemoveMemberDialog({ open: true, member, name, type })
  }

  const confirmRemoveMember = () => {
    removeMemberMutation.mutate(
      { group: id, member: removeMemberDialog.member },
      {
        onSuccess: () => {
          toast.success('Member removed')
          setRemoveMemberDialog({ open: false, member: '', name: '', type: 'user' })
        },
        onError: () => {
          toast.error('Failed to remove member')
        },
      }
    )
  }

  if (isError) {
    return (
      <Main>
        <div className='flex h-64 flex-col items-center justify-center gap-2'>
          <div className='text-destructive font-medium'>Failed to load group</div>
          <div className='text-muted-foreground text-sm'>
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      </Main>
    )
  }

  if (isLoading || !data) {
    return (
      <Main>
        <div className='flex h-64 items-center justify-center'>
          <div className='text-muted-foreground'>Loading group...</div>
        </div>
      </Main>
    )
  }

  const { group, members } = data

  return (
    <Main>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold tracking-tight'>{group.name}</h1>
        {group.description && (
          <p className='text-muted-foreground mt-1'>{group.description}</p>
        )}
      </div>

      <h2 className='text-lg font-semibold mb-4'>Members ({members.length})</h2>

      {members.length === 0 ? (
        <div className='text-muted-foreground rounded-md border py-8 text-center'>
          <User className='mx-auto mb-4 h-12 w-12 opacity-50' />
          <p>No members in this group</p>
          <p className='mt-2 text-sm'>Add users or groups to get started</p>
        </div>
      ) : (
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className='w-[80px]'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.member}>
                  <TableCell className='font-medium'>{member.name}</TableCell>
                  <TableCell>
                    <span className='inline-flex items-center gap-1'>
                      {member.type === 'group' ? (
                        <>
                          <UsersRound className='h-4 w-4' />
                          Group
                        </>
                      ) : (
                        <>
                          <User className='h-4 w-4' />
                          User
                        </>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleRemoveMember(member.member, member.name, member.type)}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog
        open={removeMemberDialog.open}
        onOpenChange={(open) => setRemoveMemberDialog({ ...removeMemberDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <span className='text-foreground font-semibold'>
                {removeMemberDialog.name}
              </span>{' '}
              from this group?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMemberMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Main>
  )
}
