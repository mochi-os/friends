const endpoints = {
  friends: {
    list: '/friends/list',
    search: '/friends/search',
    create: '/friends/create',
    accept: '/friends/accept',
    ignore: '/friends/ignore',
    delete: '/friends/delete',
  },
   auth: {
    login: '/login',
    signup: '/signup',
    verify: '/login/auth',
    logout: '/logout',
    me: '/me', // Optional: Load user profile for UI
  },
} as const

export type Endpoints = typeof endpoints

export default endpoints
