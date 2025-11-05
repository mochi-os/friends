const endpoints = {
  friends: {
    list: '/friends/list',
    search: '/friends/search',
    invite: '/friends/invite',
    create: '/friends/create',
    accept: '/friends/accept',
    ignore: '/friends/ignore',
    delete: '/friends/delete',
  },
} as const

export type Endpoints = typeof endpoints

export default endpoints
