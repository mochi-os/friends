/**
 * Centralized route configuration for all Mochi apps
 *
 * This file contains all app routes for easy maintenance and updates.
 * Use these constants instead of hardcoding URLs throughout the app.
 */
export const APP_ROUTES = {
  // Core app (Authentication)
  CORE: {
    BASE: '/',
    SIGN_IN: '/sign-in',
    SIGN_UP: '/sign-up',
    FORGOT_PASSWORD: '/forgot-password',
    OTP: '/otp',
  },
  // Chat app
  CHAT: {
    BASE: '/chat/',
    HOME: '/chat/',
  },
  // Friends app
  FRIENDS: {
    BASE: '/friends/',
    HOME: '/friends/',
  },
  // Home app (future)
  HOME: {
    BASE: '/home',
    HOME: '/home/',
  },
  // Feeds app (future)
  FEEDS: {
    BASE: '/feeds',
    HOME: '/feeds/',
  },
} as const

export type AppRoutes = typeof APP_ROUTES
