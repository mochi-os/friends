import { useMemo, useState } from 'react'
import { UserPlus, Users, MessageSquare, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { NotificationsDropdown } from '@/components/notifications-dropdown'
import {
  useFriendsQuery,
  useAcceptFriendInviteMutation,
  useDeclineFriendInviteMutation,
  useRemoveFriendMutation,
} from '@/hooks/useFriends'
import { AddFriendDialog } from './components/add-friend-dialog'

export function Friends() {
  const [search, setSearch] = useState('')
  const [addFriendDialogOpen, setAddFriendDialogOpen] = useState(false)
  const [removeFriendDialog, setRemoveFriendDialog] = useState<{
    open: boolean
    friendId: string
    friendName: string
  }>({ open: false, friendId: '', friendName: '' })
  const { data: friendsData, isLoading } = useFriendsQuery()
  const acceptInviteMutation = useAcceptFriendInviteMutation()
  const declineInviteMutation = useDeclineFriendInviteMutation()
  const removeFriendMutation = useRemoveFriendMutation()

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

  if (isLoading && !friendsData) {
    return (
      <>
        <Header>
          <Search />
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
          </div>
        </Header>
        <Main>
          <div className='flex items-center justify-center h-64'>
            <div className='text-muted-foreground'>Loading friends...</div>
          </div>
        </Main>
      </>
    )
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <NotificationsDropdown />
          <ThemeSwitch />
        </div>
      </Header>

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
              <UserPlus className='mr-2 h-4 w-4' />
              Add Friend
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
            className='w-full max-w-sm px-3 py-2 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
          />
        </div>

        <div className='grid gap-6'>
          {/* Friends List */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Friends ({filteredFriends.length})
              </CardTitle>
              <CardDescription>
                Your current friends list
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFriends.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  <Users className='mx-auto h-12 w-12 mb-4 opacity-50' />
                  <p>No friends found</p>
                  {search && <p className='text-sm mt-2'>Try adjusting your search</p>}
                </div>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                  {filteredFriends.map((friend) => (
                    <Card key={friend.id} className='group hover:shadow-md transition-shadow'>
                      <CardContent className='p-4'>
                        <div className='flex flex-col items-center text-center space-y-3'>
                          <Avatar className='h-16 w-16'>
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name}`} />
                            <AvatarFallback className='text-lg font-semibold bg-gradient-to-br from-primary to-primary/60 text-primary-foreground'>
                              {friend.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className='w-full'>
                            <p className='font-medium truncate'>{friend.name}</p>
                          </div>
                          <div className='flex items-center gap-2 w-full'>
                            <Button variant='outline' size='sm' className='flex-1'>
                              <MessageSquare className='h-4 w-4 mr-1' />
                              Chat
                            </Button>
                            <Button 
                              variant='ghost' 
                              size='sm'
                              disabled={removeFriendMutation.isPending}
                              onClick={() => handleRemoveFriend(friend.id, friend.name)}
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

          {/* Invitations */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <UserPlus className='h-5 w-5' />
                Invitations ({filteredInvites.length})
                {filteredInvites.length > 0 && (
                  <Badge variant='secondary' className='ml-2'>
                    {filteredInvites.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Pending friend requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredInvites.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  <UserPlus className='mx-auto h-12 w-12 mb-4 opacity-50' />
                  <p>No pending invitations</p>
                  {search && <p className='text-sm mt-2'>Try adjusting your search</p>}
                </div>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                  {filteredInvites.map((invite) => (
                    <Card key={invite.id} className='group hover:shadow-md transition-shadow'>
                      <CardContent className='p-4'>
                        <div className='flex flex-col items-center text-center space-y-3'>
                          <Avatar className='h-16 w-16'>
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${invite.name}`} />
                            <AvatarFallback className='text-lg font-semibold bg-gradient-to-br from-primary to-primary/60 text-primary-foreground'>
                              {invite.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className='w-full'>
                            <p className='font-medium truncate'>{invite.name}</p>
                          </div>
                          <div className='flex flex-col gap-2 w-full'>
                            <Button 
                              size='sm'
                              disabled={acceptInviteMutation.isPending}
                              onClick={() => handleAcceptInvite(invite.id)}
                              className='w-full'
                            >
                              <MessageSquare className='h-4 w-4 mr-1' />
                              Accept
                            </Button>
                            <Button 
                              variant='outline' 
                              size='sm'
                              disabled={declineInviteMutation.isPending}
                              onClick={() => handleDeclineInvite(invite.id)}
                              className='w-full'
                            >
                              <UserX className='h-4 w-4 mr-1' />
                              Decline
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
                <span className='font-semibold text-foreground'>
                  {removeFriendDialog.friendName}
                </span>{' '}
                from your friends list? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={removeFriendMutation.isPending}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRemoveFriend}
                disabled={removeFriendMutation.isPending}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              >
                {removeFriendMutation.isPending ? 'Removing...' : 'Remove Friend'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Main>
    </>
  )
}
