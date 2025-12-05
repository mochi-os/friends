export const APP_ROUTES = {
  // Chat app
  CHAT: {
    BASE: '/chat/',
    HOME: '/chat/',
  },
  // Friends app
  FRIENDS: {
    BASE: './',
    HOME: './',
  },
  // Home app (future)
  HOME: {
    BASE: '/',
    HOME: '/',
  },
  // Feeds app (future)
  FEEDS: {
    BASE: '/feeds/',
    HOME: '/feeds/',
  },
  // Notifications app
  NOTIFICATIONS: {
    BASE: '/notifications/',
    HOME: '/notifications/',
  },
  // Template app
  TEMPLATE: {
    BASE: '/template/',
    HOME: '/template/',
  },
} as const

export type AppRoutes = typeof APP_ROUTES
