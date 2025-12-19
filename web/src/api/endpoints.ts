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
    search: '/people/_/users/search',
  },
  groups: {
    list: '/people/_/groups',
    get: '/people/_/groups/get',
    create: '/people/_/groups/create',
    update: '/people/_/groups/update',
    delete: '/people/_/groups/delete',
    memberAdd: '/people/_/groups/members/add',
    memberRemove: '/people/_/groups/members/remove',
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
