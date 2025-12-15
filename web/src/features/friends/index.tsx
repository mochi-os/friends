import { useMemo, useState } from 'react'
import { APP_ROUTES } from '@/config/app-routes'
import { UserPlus, Users, MessageSquare, UserX } from 'lucide-react'
import { toast } from 'sonner'
import type { Friend } from '@/api/types/friends'
import { useCreateChatMutation } from '@/hooks/useChats'
import {
  useFriendsQuery,
  useAcceptFriendInviteMutation,
  useDeclineFriendInviteMutation,
  useRemoveFriendMutation,
} from '@/hooks/useFriends'
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
import { Badge } from '@mochi/common'
import { Button } from '@mochi/common'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mochi/common'
import { FacelessAvatar } from '@mochi/common'
import { Main } from '@mochi/common'
import { AddFriendDialog } from './components/add-friend-dialog'

export function Friends() {
  const [search, setSearch] = useState('')
  const [addFriendDialogOpen, setAddFriendDialogOpen] = useState(false)
  const [removeFriendDialog, setRemoveFriendDialog] = useState<{
    open: boolean
    friendId: string
    friendName: string
  }>({ open: false, friendId: '', friendName: '' })
  const [pendingChatFriendId, setPendingChatFriendId] = useState<string | null>(
    null
  )
  const { data: friendsData, isLoading, isError, error } = useFriendsQuery()
  const acceptInviteMutation = useAcceptFriendInviteMutation()
  const declineInviteMutation = useDeclineFriendInviteMutation()
  const removeFriendMutation = useRemoveFriendMutation()
  const startChatMutation = useCreateChatMutation({
    onSuccess: (data) => {
      setPendingChatFriendId(null)
      toast.success('Chat ready', {
        description: 'Redirecting you to the conversation.',
      })
      const chatId = data.id
      if (!chatId) {
        return
      }
      let chatBaseUrl =
        import.meta.env.VITE_APP_CHAT_URL ?? APP_ROUTES.CHAT.HOME

      // Ensure chatBaseUrl ends with a slash before appending search params
      if (!chatBaseUrl.endsWith('/')) {
        chatBaseUrl = chatBaseUrl + '/'
      }

      console.log('chatBaseUrl', chatBaseUrl)
      const chatUrl = chatBaseUrl.startsWith('http')
        ? new URL(chatBaseUrl, undefined)
        : new URL(chatBaseUrl, window.location.origin)
      chatUrl.searchParams.set('chat', chatId)
      console.log('chatUrl', chatUrl)
      /**
       * NOTE: Chat lives in a separate micro-app. Use full-page navigation so the chat app
       * can bootstrap with the selected chat ID.
       */
      window.location.assign(chatUrl.toString())
    },
    onError: (error) => {
      setPendingChatFriendId(null)
      const description =
        error instanceof Error ? error.message : 'Please try again.'
      toast.error('Unable to start chat', { description })
    },
  })

  const filteredFriends = useMemo(() => {
    const list = friendsData?.friends ?? []
    return list.filter((friend) =>
      friend.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [friendsData?.friends, search])

  const filteredInvites = useMemo(() => {
    const list = friendsData?.invites ?? []
    return list.filter((invite) =>
      invite.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [friendsData?.invites, search])

  const handleAcceptInvite = (friendId: string) => {
    acceptInviteMutation.mutate({ friendId })
  }

  const handleDeclineInvite = (friendId: string) => {
    declineInviteMutation.mutate({ friendId })
  }

  const handleRemoveFriend = (friendId: string, friendName: string) => {
    setRemoveFriendDialog({ open: true, friendId, friendName })
  }

  const confirmRemoveFriend = () => {
    removeFriendMutation.mutate(
      { friendId: removeFriendDialog.friendId },
      {
        onSuccess: () => {
          setRemoveFriendDialog({ open: false, friendId: '', friendName: '' })
        },
      }
    )
  }

  const handleStartChat = (friend: Friend) => {
    if (startChatMutation.isPending) {
      return
    }

    const chatName = friend.name?.trim()
    if (!chatName) {
      toast.error('Unable to start chat', {
        description: 'Friend name is missing. Please try again later.',
      })
      return
    }

    // TODO: Reuse an existing DM once chat-to-friend mapping is available.
    setPendingChatFriendId(friend.id)
    startChatMutation.mutate({ participantIds: [friend.id], name: chatName })
  }

  if (isError) {
    return (
      <Main>
        <div className='flex h-64 flex-col items-center justify-center gap-2'>
          <div className='text-destructive font-medium'>Failed to load friends</div>
          <div className='text-muted-foreground text-sm'>
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      </Main>
    )
  }

  if (isLoading && !friendsData) {
    return (
      <Main>
        <div className='flex h-64 items-center justify-center'>
          <div className='text-muted-foreground'>Loading friends...</div>
        </div>
      </Main>
    )
  }

  return (
    <>


      <Main>
        <div className='mb-6 flex items-center justify-between space-y-2'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Friends</h1>
            <p className='text-muted-foreground'>
              Manage your friends and invitations
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <Button onClick={() => setAddFriendDialogOpen(true)}>
              Add Friend
              <UserPlus className='ml-2 h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className='mb-6'>
          <input
            type='text'
            placeholder='Search friends...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='border-border bg-background focus:ring-ring w-full max-w-sm rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none'
          />
        </div>

        <div className='grid gap-6'>
          {/* Invitations */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <UserPlus className='h-5 w-5' />
                Invitations ({filteredInvites.length})
                {filteredInvites.length > 0 && (
                  <Badge variant='secondary' className='ml-2 flex items-center gap-1'>
                    <UserPlus className='h-3 w-3' />
                    {filteredInvites.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Pending friend requests</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredInvites.length === 0 ? (
                <div className='text-muted-foreground py-8 text-center'>
                  <UserPlus className='mx-auto mb-4 h-12 w-12 opacity-50' />
                  <p>No pending invitations</p>
                  {search && (
                    <p className='mt-2 text-sm'>Try adjusting your search</p>
                  )}
                </div>
              ) : (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                  {filteredInvites.map((invite) => (
                    <Card
                      key={invite.id}
                      className='group transition-shadow hover:shadow-md'
                    >
                      <CardContent className='p-4'>
                        <div className='flex flex-col items-center space-y-3 text-center'>
                          <FacelessAvatar
                            name={invite.name}
                            seed={invite.id || invite.name}
                            size={64}
                          />
                          <div className='w-full'>
                            <p className='truncate font-medium'>
                              {invite.name}
                            </p>
                          </div>
                          <div className='flex w-full flex-col gap-2'>
                            <Button
                              size='sm'
                              disabled={acceptInviteMutation.isPending}
                              onClick={() => handleAcceptInvite(invite.id)}
                              className='w-full'
                            >
                              Accept
                              <MessageSquare className='ml-1 h-4 w-4' />
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              disabled={declineInviteMutation.isPending}
                              onClick={() => handleDeclineInvite(invite.id)}
                              className='w-full'
                            >
                              Decline
                              <UserX className='ml-1 h-4 w-4' />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Friends List */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Friends ({filteredFriends.length})
              </CardTitle>
              <CardDescription>Your current friends list</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFriends.length === 0 ? (
                <div className='text-muted-foreground py-8 text-center'>
                  <Users className='mx-auto mb-4 h-12 w-12 opacity-50' />
                  <p>No friends found</p>
                  {search && (
                    <p className='mt-2 text-sm'>Try adjusting your search</p>
                  )}
                </div>
              ) : (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                  {filteredFriends.map((friend) => (
                    <Card
                      key={friend.id}
                      className='group transition-shadow hover:shadow-md'
                    >
                      <CardContent className='p-4'>
                        <div className='flex flex-col items-center space-y-3 text-center'>
                          <FacelessAvatar
                            name={friend.name}
                            seed={friend.id || friend.name}
                            size={64}
                          />
                          <div className='w-full'>
                            <p className='truncate font-medium'>
                              {friend.name}
                            </p>
                          </div>
                          <div className='flex w-full items-center gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              className='flex-1'
                              disabled={
                                startChatMutation.isPending &&
                                pendingChatFriendId === friend.id
                              }
                              onClick={() => handleStartChat(friend)}
                            >
                              {startChatMutation.isPending &&
                                pendingChatFriendId === friend.id
                                ? 'Opening...'
                                : 'Chat'}
                              <MessageSquare className='ml-1 h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              disabled={removeFriendMutation.isPending}
                              onClick={() =>
                                handleRemoveFriend(friend.id, friend.name)
                              }
                            >
                              <UserX className='h-4 w-4' />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <AddFriendDialog
          open={addFriendDialogOpen}
          onOpenChange={setAddFriendDialogOpen}
        />

        {/* Remove Friend Confirmation Dialog */}
        <AlertDialog
          open={removeFriendDialog.open}
          onOpenChange={(open) =>
            setRemoveFriendDialog({ ...removeFriendDialog, open })
          }
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Friend</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove{' '}
                <span className='text-foreground font-semibold'>
                  {removeFriendDialog.friendName}
                </span>{' '}
                from your friends list? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={removeFriendMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRemoveFriend}
                disabled={removeFriendMutation.isPending}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              >
                {removeFriendMutation.isPending
                  ? 'Removing...'
                  : 'Remove Friend'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Main>
    </>
  )
}
