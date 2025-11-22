"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

/**
 * ThemeProvider wraps the application with the next-themes provider.
 * This component must be a client component to use the context.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
}
