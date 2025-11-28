import { useEffect, useState, useMemo } from 'react'
import { Search, Loader2, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSearchUsersQuery, useCreateFriendMutation } from '@/hooks/useFriends'
import { Button } from '@/components/ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FacelessAvatar } from '@/components/faceless-avatar'

interface AddFriendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MIN_SEARCH_LENGTH = 2

export function AddFriendDialog({ onOpenChange, open }: AddFriendDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [requestedUserIds, setRequestedUserIds] = useState<Record<string, boolean>>(
    {}
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const normalizedQuery = debouncedQuery.trim()
  const canSearch = normalizedQuery.length >= MIN_SEARCH_LENGTH
  const hasTyped = searchQuery.trim().length > 0
  const needsMoreCharacters =
    hasTyped && searchQuery.trim().length < MIN_SEARCH_LENGTH

  const { data, isLoading, isError, error } = useSearchUsersQuery(
    normalizedQuery,
    {
      enabled: open && canSearch,
    }
  )

  const createFriendMutation = useCreateFriendMutation({
    onSuccess: (_, variables) => {
      if (variables?.id) {
        setRequestedUserIds((prev) => ({ ...prev, [variables.id]: true }))
      }
      setPendingUserId(null)
      toast.success('Friend added successfully!', {
        description: `${variables.name} has been added to your friends list.`,
      })
    },
    onError: (mutationError, variables) => {
      if (variables?.id) {
        setRequestedUserIds((prev) => {
          if (!prev[variables.id]) {
            return prev
          }
          const next = { ...prev }
          delete next[variables.id]
          return next
        })
      }
      setPendingUserId(null)
      toast.error('Failed to add friend', {
        description:
          mutationError instanceof Error
            ? mutationError.message
            : 'Please try again.',
      })
    },
  })

  const users = useMemo(
    () => data?.data?.results ?? [],
    [data?.data?.results]
  )

  const handleAddFriend = (userId: string, userName: string) => {
    if (requestedUserIds[userId]) {
      return
    }
    setPendingUserId(userId)
    createFriendMutation.mutate({
      id: userId,
      name: userName,
    })
  }

  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setDebouncedQuery('')
    }
  }, [open])

  const showResults = canSearch
  const showLoading = isLoading && canSearch
  const showEmpty = !isLoading && users.length === 0 && canSearch

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className='gap-0 flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-[600px]'>
        <ResponsiveDialogHeader className='border-b px-6 pt-6 pb-4'>
          <ResponsiveDialogTitle className='text-2xl font-semibold'>
            Add Friend
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className='text-muted-foreground mt-1 text-sm'>
            Search for users by name to add them as friends
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className='flex min-h-0 flex-1 flex-col gap-4 px-6 py-4'>
          <div className='space-y-2'>
            <div className='relative'>
              <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2' />
              <Input
                placeholder='Search users...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='h-11 rounded-full border-2 pl-11 pr-12'
                autoFocus
              />
              {searchQuery.length > 0 && (
                <button
                  type='button'
                  aria-label='Clear search'
                  className='text-muted-foreground hover:text-foreground absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
                  onClick={() => {
                    setSearchQuery('')
                    setDebouncedQuery('')
                  }}
                >
                  <X className='h-4 w-4' />
                </button>
              )}
            </div>
            {needsMoreCharacters && (
              <p className='text-muted-foreground text-xs'>
                Type at least 2 characters to search
              </p>
            )}
          </div>

          <div className='flex min-h-0 flex-1'>
            <ScrollArea className='flex-1 rounded-2xl border'>
              <div className='p-3'>
                {!showResults && (
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <UserPlus className='text-muted-foreground mb-3 h-12 w-12 opacity-50' />
                    <p className='text-muted-foreground text-sm font-medium'>
                      Start typing to search for users
                    </p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      Enter a name to find people you want to add
                    </p>
                  </div>
                )}

                {showLoading && (
                  <div className='flex items-center justify-center py-12'>
                    <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
                  </div>
                )}

                {isError && showResults && (
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <p className='text-destructive mb-1 text-sm font-medium'>
                      Failed to search users
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      {error instanceof Error ? error.message : 'Unknown error'}
                    </p>
                  </div>
                )}

                {showEmpty && (
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <Search className='text-muted-foreground mb-3 h-12 w-12 opacity-50' />
                    <p className='text-muted-foreground text-sm font-medium'>
                      No users found
                    </p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      Try a different search term
                    </p>
                  </div>
                )}

                {!isLoading && users.length > 0 && (
                  <div className='space-y-1.5'>
                    {users.map((user) => {
                      const isMutatingCurrent =
                        pendingUserId === user.id &&
                        createFriendMutation.isPending
                      const isRequestPending = requestedUserIds[user.id]
                      return (
                        <div
                          key={user.id}
                          className={cn(
                            'flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors',
                            'hover:border-primary/50 hover:bg-accent'
                          )}
                        >
                          <div className='flex min-w-0 flex-1 items-center gap-3'>
                            <FacelessAvatar
                              name={user.name}
                              seed={user.id}
                              size={40}
                            />
                            <div className='flex min-w-0 flex-1 flex-col'>
                              <span className='truncate text-sm font-medium'>
                                {user.name}
                              </span>
                              <span className='text-muted-foreground truncate text-xs'>
                                {user.fingerprint_hyphens}
                              </span>
                            </div>
                          </div>
                          <Button
                            size='sm'
                            onClick={() => handleAddFriend(user.id, user.name)}
                            disabled={isMutatingCurrent || isRequestPending}
                            variant={isRequestPending ? 'secondary' : 'default'}
                          >
                            {isRequestPending
                              ? 'Invite Sent'
                              : isMutatingCurrent
                                ? 'Sending...'
                                : (
                                    <>
                                      <UserPlus className='mr-2 h-4 w-4' />
                                      Add Friend
                                    </>
                                  )}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className='flex items-center justify-end border-t px-6 py-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
