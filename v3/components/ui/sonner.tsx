'use client'

import { Toaster as Sonner } from 'sonner'

const Toaster = () => {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      duration={3000}
      style={
        {
          '--normal-bg': '#111111',
          '--normal-border': '#232323',
          '--normal-text': '#ffffff',
        } as Record<string, string>
      }
    />
  )
}

export { Toaster }
