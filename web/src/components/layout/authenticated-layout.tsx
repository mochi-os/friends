import { Outlet } from '@tanstack/react-router'

import { LayoutProvider } from '@mochi/common'
import { SearchProvider } from '@mochi/common'

import { TopBar } from '@mochi/common'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  

  return (
    <SearchProvider>
      <LayoutProvider>
        <div className="flex h-svh flex-col">
          <TopBar title="Friends" />
          <main className="flex-1 overflow-auto">
            {children ?? <Outlet />}
          </main>
        </div>
      </LayoutProvider>
    </SearchProvider>
  )
}
