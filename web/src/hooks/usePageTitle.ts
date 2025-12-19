import { useEffect } from 'react'
import { useLayout } from '@mochi/common'

export function usePageTitle(title: string) {
  const { setTopBarTitle } = useLayout()

  useEffect(() => {
    document.title = `${title} - Mochi`
    setTopBarTitle(title)

    return () => {
      setTopBarTitle(null)
    }
  }, [title, setTopBarTitle])
}
