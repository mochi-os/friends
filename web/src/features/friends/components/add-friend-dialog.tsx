import { useEffect, useState, useMemo } from 'react'
import { Search, Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@mochi/common'
import { useSearchUsersQuery, useCreateFriendMutation } from '@/hooks/useFriends'
import { Avatar, AvatarFallback, AvatarImage } from '@mochi/common'
import { Button } from '@mochi/common'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@mochi/common'
import { Input } from '@mochi/common'
// import { Label } from '@mochi/common'
import { ScrollArea } from '@mochi/common'
import { buildAvatarUrl } from '../utils/avatar'
import { FRIENDS_STRINGS } from '../constants'

type AddFriendDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddFriendDialog({ onOpenChange, open }: AddFriendDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data, isLoading, isError, error } = useSearchUsersQuery(debouncedQuery, {
    enabled: open && debouncedQuery.length > 0,
  })

  const createFriendMutation = useCreateFriendMutation({
    onSuccess: (_, variables) => {
      toast.success(FRIENDS_STRINGS.SUCCESS_INVITATION_SENT, {
        description: `${FRIENDS_STRINGS.SUCCESS_INVITATION_SENT_DESC} ${variables.name}.`,
      })
    },
    onError: (error) => {
      toast.error(FRIENDS_STRINGS.ERR_ADD_FRIEND, {
        description:
          error instanceof Error ? error.message : FRIENDS_STRINGS.ERR_GENERIC,
      })
    },
  })

  const users = useMemo(
    () => data?.results ?? [],
    [data?.results]
  )

  const handleAddFriend = (userId: string, userName: string) => {
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

  const showResults = debouncedQuery.length > 0
  const showLoading = isLoading && debouncedQuery.length > 0
  const showEmpty = !isLoading && users.length === 0 && debouncedQuery.length > 0

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className='flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-[600px]'>
        <ResponsiveDialogHeader className='border-b px-6 pt-6 pb-4'>
          <ResponsiveDialogTitle className='text-2xl font-semibold'>
            {FRIENDS_STRINGS.ADD_FRIEND_DIALOG_TITLE}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className='text-muted-foreground mt-1 text-sm'>
            {FRIENDS_STRINGS.ADD_FRIEND_DIALOG_DESC}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className='flex min-h-0 flex-1 flex-col gap-4 px-6 py-4'>
          {/* Search Input */}
          <div className='space-y-2'>
            {/* <Label className='flex items-center gap-1.5 text-sm font-medium'>
              <Search className='h-4 w-4' />
              Search Users
            </Label> */}
            <div className='relative'>
              <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
              <Input
                placeholder={FRIENDS_STRINGS.SEARCH_USERS_PLACEHOLDER}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='h-10 pl-9'
                autoFocus
              />
            </div>
            {searchQuery.length > 0 && searchQuery.length < 2 && (
              <p className='text-muted-foreground text-xs'>
                {FRIENDS_STRINGS.SEARCH_MIN_CHARS}
              </p>
            )}
          </div>

          {/* Results List */}
          <ScrollArea className='flex-1 rounded-lg border'>
            <div className='p-2 min-h-[250px] h-[15rem]'>
              {!showResults && (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <UserPlus className='text-muted-foreground mb-3 h-12 w-12 opacity-50' />
                  <p className='text-muted-foreground text-sm font-medium'>
                    {FRIENDS_STRINGS.SEARCH_PROMPT_TITLE}
                  </p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    {FRIENDS_STRINGS.SEARCH_PROMPT_DESC}
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
                    {FRIENDS_STRINGS.ERR_SEARCH_FAILED}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {error instanceof Error ? error.message : FRIENDS_STRINGS.ERR_UNKNOWN}
                  </p>
                </div>
              )}

              {showEmpty && (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <Search className='text-muted-foreground mb-3 h-12 w-12 opacity-50' />
                  <p className='text-muted-foreground text-sm font-medium'>
                    {FRIENDS_STRINGS.NO_USERS_FOUND}
                  </p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    {FRIENDS_STRINGS.TRY_DIFFERENT_TERM}
                  </p>
                </div>
              )}

              {!isLoading && users.length > 0 && (
                <div className='space-y-1'>
                  {users.map((user) => {
                    const isPending = createFriendMutation.isPending
                    return (
                      <div
                        key={user.id}
                        className={cn(
                          'flex cursor-pointer items-center justify-between gap-3 rounded-lg p-3 transition-all',
                          'hover:bg-accent hover:text-accent-foreground',
                          'group'
                        )}
                      >
                        <div className='flex min-w-0 flex-1 items-center gap-3'>
                          <Avatar className='h-10 w-10 shrink-0'>
                            <AvatarImage
                              src={buildAvatarUrl(user.id)}
                              alt={`${user.name} avatar`}
                            />
                            <AvatarFallback className='from-primary to-primary/60 text-primary-foreground bg-gradient-to-br font-semibold'>
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
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
                          disabled={isPending}
                        >
                          {isPending ? (
                            <>
                              {FRIENDS_STRINGS.ADDING}
                              <Loader2 className='ml-2 h-4 w-4 animate-spin' />
                            </>
                          ) : (
                            <>
                              {FRIENDS_STRINGS.ADD_FRIEND}
                              <UserPlus className='ml-2 h-4 w-4' />
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

        <div className='bg-muted/30 flex items-center justify-between gap-3 border-t px-6 py-4'>
          <div className='text-muted-foreground text-sm'>
            {users.length > 0 ? (
              <span>
                <span className='text-foreground font-medium'>
                  {users.length}
                </span>{' '}
                {users.length === 1 ? FRIENDS_STRINGS.USER : FRIENDS_STRINGS.USERS} {FRIENDS_STRINGS.FOUND}
              </span>
            ) : debouncedQuery.length > 0 ? (
              <span>{FRIENDS_STRINGS.NO_USERS_FOUND}</span>
            ) : (
              <span>{FRIENDS_STRINGS.ENTER_NAME_TO_SEARCH}</span>
            )}
          </div>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            {FRIENDS_STRINGS.CLOSE}
          </Button>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

