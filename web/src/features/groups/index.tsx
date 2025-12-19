import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, UsersRound, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import {
  useGroupsQuery,
  useDeleteGroupMutation,
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
import { Card, CardContent } from '@mochi/common'
import { Main } from '@mochi/common'
import { GroupDialog } from './group-dialog'
import type { Group } from '@/api/types/groups'

export function Groups() {
  usePageTitle('Groups')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editGroup, setEditGroup] = useState<Group | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    group: Group | null
  }>({ open: false, group: null })

  const { data: groups, isLoading, isError, error } = useGroupsQuery()
  const deleteMutation = useDeleteGroupMutation()

  const filteredGroups = (groups ?? []).filter((group) =>
    group.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleEdit = (group: Group) => {
    setEditGroup(group)
    setDialogOpen(true)
  }

  const handleDelete = (group: Group) => {
    setDeleteDialog({ open: true, group })
  }

  const confirmDelete = () => {
    if (!deleteDialog.group) return
    deleteMutation.mutate(
      { id: deleteDialog.group.id },
      {
        onSuccess: () => {
          toast.success('Group deleted')
          setDeleteDialog({ open: false, group: null })
        },
        onError: () => {
          toast.error('Failed to delete group')
        },
      }
    )
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditGroup(null)
  }

  if (isError) {
    return (
      <Main>
        <div className='flex h-64 flex-col items-center justify-center gap-2'>
          <div className='text-destructive font-medium'>Failed to load groups</div>
          <div className='text-muted-foreground text-sm'>
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      </Main>
    )
  }

  if (isLoading) {
    return (
      <Main>
        <div className='flex h-64 items-center justify-center'>
          <div className='text-muted-foreground'>Loading groups...</div>
        </div>
      </Main>
    )
  }

  return (
    <Main>
      <div className='mb-6 flex items-center justify-between space-y-2'>
        <h1 className='text-2xl font-bold tracking-tight'>Groups</h1>
        <div className='flex items-center gap-2'>
          <input
            type='text'
            placeholder='Search...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='border-border bg-background focus:ring-ring w-48 rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none'
          />
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Create group
          </Button>
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <div className='text-muted-foreground py-8 text-center'>
          <UsersRound className='mx-auto mb-4 h-12 w-12 opacity-50' />
          <p>No groups found</p>
          {search && (
            <p className='mt-2 text-sm'>Try adjusting your search</p>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {filteredGroups.map((group) => (
            <Card
              key={group.id}
              className='group transition-shadow hover:shadow-md'
            >
              <CardContent className='p-4'>
                <div className='flex flex-col space-y-3'>
                  <div>
                    <Link
                      to='/groups/$id'
                      params={{ id: group.id }}
                      className='font-medium hover:underline'
                    >
                      {group.name}
                    </Link>
                    {group.description && (
                      <p className='text-muted-foreground mt-1 text-sm line-clamp-2'>
                        {group.description}
                      </p>
                    )}
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='flex-1'
                      onClick={() => handleEdit(group)}
                    >
                      <Pencil className='mr-1 h-4 w-4' />
                      Edit
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDelete(group)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GroupDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        group={editGroup}
      />

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='text-foreground font-semibold'>
                {deleteDialog.group?.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Main>
  )
}
