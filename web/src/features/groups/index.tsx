import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, UsersRound, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import {
  useGroupsQuery,
  useDeleteGroupMutation,
} from '@/hooks/useGroups'
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
import { GroupDialog } from './group-dialog'
import type { Group } from '@/api/types/groups'

export function Groups() {
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
            Create Group
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
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className='w-[100px]'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <Link
                      to='/groups/$id'
                      params={{ id: group.id }}
                      className='font-medium hover:underline'
                    >
                      {group.name}
                    </Link>
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {group.description || '-'}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleEdit(group)}
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleDelete(group)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
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
