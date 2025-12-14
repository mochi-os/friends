import { Outlet } from '@tanstack/react-router'
import { SearchProvider } from '@mochi/common'

type SimpleLayoutProps = {
  children?: React.ReactNode
}

export function SimpleLayout({ children }: SimpleLayoutProps) {
  return (
    <SearchProvider>
      <div className="min-h-svh">
        {children ?? <Outlet />}
      </div>
    </SearchProvider>
  )
}
