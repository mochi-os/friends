const endpoints = {
  friends: {
    list: '/people/-/friends',
    search: '/people/-/friends/search',
    create: '/people/-/friends/create',
    accept: '/people/-/friends/accept',
    ignore: '/people/-/friends/ignore',
    delete: '/people/-/friends/delete',
  },
  users: {
    search: '/people/api/users/search',
  },
  groups: {
    list: '/people/api/groups',
    get: '/people/api/groups/get',
    create: '/people/api/groups/create',
    update: '/people/api/groups/update',
    delete: '/people/api/groups/delete',
    memberAdd: '/people/api/groups/members/add',
    memberRemove: '/people/api/groups/members/remove',
  },
  chat: {
    list: '/chat/list',
    new: '/chat/new',
    create: '/chat/create',
    messages: (chatId: string) => `/chat/${chatId}/messages`,
    send: (chatId: string) => `/chat/${chatId}/send`,
    detail: (chatId: string) => `/chat/${chatId}`,
  },
  auth: {
    code: '/_/code',
    verify: '/_/verify',
    identity: '/_/identity',
    logout: '/_/logout',
  },
} as const

export type Endpoints = typeof endpoints

export default endpoints
