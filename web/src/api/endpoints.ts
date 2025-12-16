const endpoints = {
  friends: {
    list: '/friends/list',
    search: '/friends/search',
    create: '/friends/create',
    accept: '/friends/accept',
    ignore: '/friends/ignore',
    delete: '/friends/delete',
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
