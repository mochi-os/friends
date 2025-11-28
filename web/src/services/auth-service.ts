// feat(auth): implement login-header based auth flow
// Note: Auth is handled by core app, this service only manages local auth state
import { useAuthStore } from '@/stores/auth-store'
import { env } from '@mochi/config/env'

// Type definitions (moved from auth API since it's removed)
// Note: Must match AuthUser from auth-store.ts
type AuthUser = {
  email?: string
  name?: string
  accountNo?: string
  role?: string[] // Match the store type (array)
  exp?: number
}

const devConsole = globalThis.console

/**
 * Log errors in development mode only
 */
const logError = (context: string, error: unknown) => {
  if (env.debug) {
    devConsole?.error?.(`[Auth Service] ${context}`, error)
  }
}

/**
 * Request verification code for email
 * Auth is handled by core app - this is a placeholder
 */
export const requestCode = async () => {
  // Auth is handled by core app - this is a placeholder
  // In practice, user should authenticate via /login
  throw new Error('Authentication is handled by the core app. Please use /login')
}

/**
 * Verify code and authenticate user
 * Auth is handled by core app - this is a placeholder
 */
export const verifyCode = async () => {
  // Auth is handled by core app - this is a placeholder
  // In practice, user should authenticate via /login
  throw new Error('Authentication is handled by the core app. Please use /login')
}

/**
 * Validate current session by fetching user info
 *
 * This function checks if the current session is valid by:
 * 1. Checking for credentials (login or token) in store
 * 2. Optionally calling /me endpoint to validate with backend
 * 3. Updating user data if successful
 * 4. Clearing auth if validation fails
 *
 * @returns User info if session is valid, null otherwise
 */
export const validateSession = async (): Promise<AuthUser | null> => {
  try {
    // Check if we have any credentials
    const { rawLogin, accessToken, user } = useAuthStore.getState()

    if (!rawLogin && !accessToken) {
      return null
    }

    // TODO: Uncomment when backend implements /me endpoint
    // try {
    //   const response: MeResponse = await authApi.me()
    //   useAuthStore.getState().setUser(response.user)
    //   return response.user
    // } catch (meError) {
    //   logError('Failed to fetch user profile from /me', meError)
    //   // If /me fails, clear auth
    //   useAuthStore.getState().clearAuth()
    //   return null
    // }

    // For now, just return the current user from store
    // This assumes the credentials are valid if they exist
    // Type assertion needed because store's AuthUser has role as string[]
    return user as AuthUser | null
  } catch (error) {
    logError('Failed to validate session', error)
    // Clear auth on validation failure
    useAuthStore.getState().clearAuth()
    return null
  }
}

/**
 * Logout user
 *
 * This function:
 * 1. Optionally calls backend logout endpoint
 * 2. Clears all authentication state (cookies + store)
 * 3. Always succeeds (clears local state even if backend call fails)
 */
export const logout = async (): Promise<void> => {
  // Clear auth state
  useAuthStore.getState().clearAuth()
  // Redirect to core auth app
  window.location.href = env.authLoginUrl
}

/**
 * Load user profile from /me endpoint
 *
 * This function:
 * 1. Checks for credentials in store
 * 2. Calls /me endpoint to get user profile
 * 3. Updates store with user data
 * 4. Returns user info or null
 *
 * Call this after successful authentication to populate user data for UI.
 *
 * @returns User info if successful, null otherwise
 */
export const loadUserProfile = async (): Promise<AuthUser | null> => {
  try {
    // Check if we have credentials first
    const { rawLogin, accessToken } = useAuthStore.getState()

    if (!rawLogin && !accessToken) {
      return null
    }

    // TODO: Uncomment when backend implements /me endpoint
    // try {
    //   const response: MeResponse = await authApi.me()
    //   useAuthStore.getState().setUser(response.user)
    //   return response.user
    // } catch (meError) {
    //   logError('Failed to fetch user profile from /me', meError)
    //   // Fall through to return current user from store
    // }

    // For now, return current user from store
    // (might be from JWT decode or from login response)
    // Type assertion needed because store's AuthUser has role as string[]
    return useAuthStore.getState().user as AuthUser | null
  } catch (error) {
    logError('Failed to load user profile', error)
    return null
  }
}

// Alias for backward compatibility
export const sendVerificationCode = requestCode

export type { AuthUser }
