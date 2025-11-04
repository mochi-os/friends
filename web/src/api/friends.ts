import endpoints from '@/api/endpoints'
import type {
  AcceptInviteRequest,
  CreateFriendRequest,
  DeclineInviteRequest,
  Friend,
  FriendInvite,
  GetFriendsListRaw,
  GetFriendsListResponse,
  InviteFriendRequest,
  MutationSuccessResponse,
  SearchUsersResponse,
} from '@/api/types/friends'
import { requestHelpers } from '@/lib/request'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object'

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  isRecord(value) ? (value as Record<string, unknown>) : undefined

const toNumber = (value: unknown): number | undefined =>
  typeof value === 'number' ? value : undefined

const devConsole = globalThis.console

const logUnexpectedStructure = (payload: unknown) => {
  if (import.meta.env.DEV) {
    devConsole?.warn?.('[API] friends response shape unexpected', payload)
  }
}

const pickList = <T>(values: unknown[], keyOrder: string[]): T[] => {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value as T[]
    }

    const record = asRecord(value)
    if (!record) {
      continue
    }

    for (const key of keyOrder) {
      if (!(key in record)) {
        continue
      }

      const candidate = record[key]
      if (candidate === value) {
        continue
      }

      const nested = pickList<T>([candidate], keyOrder)

      if (nested.length) {
        return nested
      }
    }
  }

  return []
}

const normalizeFriendsList = (
  payload: GetFriendsListRaw
): GetFriendsListResponse => {
  if (Array.isArray(payload)) {
    return {
      friends: payload as Friend[],
      invites: [],
    }
  }

  const record = asRecord(payload)
  if (!record) {
    logUnexpectedStructure(payload)
    return { friends: [], invites: [] }
  }

  const dataRecord = asRecord(record.data)

  const friends = pickList<Friend>(
    [record.friends, record.data, record.items, record.results],
    ['friends', 'data', 'items', 'results']
  )
  const invites = pickList<FriendInvite>(
    [record.invites, record.data, record.items, record.results],
    ['invites', 'data', 'items', 'results']
  )

  if (!friends.length && !invites.length) {
    logUnexpectedStructure(payload)
  }

  return {
    friends,
    invites,
    total: toNumber(record.total) ?? toNumber(dataRecord?.total),
    page: toNumber(record.page) ?? toNumber(dataRecord?.page),
    limit: toNumber(record.limit) ?? toNumber(dataRecord?.limit),
  }
}

const listFriends = async (): Promise<GetFriendsListResponse> => {
  const response = await requestHelpers.get<GetFriendsListRaw>(
    endpoints.friends.list
  )
  return normalizeFriendsList(response)
}

const searchUsers = async (query: string): Promise<SearchUsersResponse> => {
  const response = await requestHelpers.get<SearchUsersResponse>(
    endpoints.friends.search,
    {
      params: { search: query },
    }
  )
  return response
}

const inviteFriend = (payload: InviteFriendRequest) =>
  requestHelpers.post<MutationSuccessResponse>(
    endpoints.friends.invite,
    payload
  )

const createFriend = (payload: CreateFriendRequest) =>
  requestHelpers.post<MutationSuccessResponse>(
    endpoints.friends.create,
    {},
    {
      params: {
        id: payload.id,
        name: payload.name,
      },
    }
  )

const acceptFriendInvite = (payload: AcceptInviteRequest) =>
  requestHelpers.post<MutationSuccessResponse>(
    endpoints.friends.accept,
    payload
  )

const declineFriendInvite = (payload: DeclineInviteRequest) =>
  requestHelpers.post<MutationSuccessResponse>(
    endpoints.friends.ignore,
    payload
  )

const removeFriend = (friendId: string) =>
  requestHelpers.post<MutationSuccessResponse>(
    endpoints.friends.delete,
    {},
    {
      params: {
        id: friendId,
      },
    }
  )

export const friendsApi = {
  list: listFriends,
  searchUsers,
  invite: inviteFriend,
  create: createFriend,
  acceptInvite: acceptFriendInvite,
  declineInvite: declineFriendInvite,
  remove: removeFriend,
}

export type {
  AcceptInviteRequest,
  CreateFriendRequest,
  DeclineInviteRequest,
  Friend,
  FriendInvite,
  GetFriendsListResponse,
  InviteFriendRequest,
  MutationSuccessResponse,
  SearchUsersResponse,
}

export default friendsApi
