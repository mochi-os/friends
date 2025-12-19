import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  useCreateGroupMutation,
  useUpdateGroupMutation,
} from '@/hooks/useGroups'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mochi/common'
import { Button } from '@mochi/common'
import { Input } from '@mochi/common'
import { Label } from '@mochi/common'
import { Textarea } from '@mochi/common'
import type { Group } from '@/api/types/groups'

interface GroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: Group | null
}

export function GroupDialog({ open, onOpenChange, group }: GroupDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const isEditing = !!group
  const createMutation = useCreateGroupMutation()
  const updateMutation = useUpdateGroupMutation()

  useEffect(() => {
    if (open) {
      if (group) {
        setName(group.name)
        setDescription(group.description || '')
      } else {
        setName('')
        setDescription('')
      }
    }
  }, [open, group])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Name is required')
      return
    }

    if (isEditing) {
      updateMutation.mutate(
        { id: group.id, name: name.trim(), description: description.trim() },
        {
          onSuccess: () => {
            toast.success('Group updated')
            onOpenChange(false)
          },
          onError: () => {
            toast.error('Failed to update group')
          },
        }
      )
    } else {
      createMutation.mutate(
        { name: name.trim(), description: description.trim() },
        {
          onSuccess: () => {
            toast.success('Group created')
            onOpenChange(false)
          },
          onError: () => {
            toast.error('Failed to create group')
          },
        }
      )
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit group' : 'Create group'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the group name and description.'
                : 'Create a new group to organize users.'}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='name'>Name</Label>
              <Input
                id='name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Group name'
                disabled={isPending}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Optional description'
                disabled={isPending}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
