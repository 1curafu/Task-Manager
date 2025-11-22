import * as React from "react"
import { ThemeToggle } from "@/components/ThemeToggle"
import "./auth.css"

interface AuthLayoutProps {
  children: React.ReactNode
}

/**
 * AuthLayout wraps all authentication pages.
 * It provides a consistent layout with a theme toggle in the top-right corner.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      <div className="auth-theme-toggle">
        <ThemeToggle />
      </div>
      {children}
    </div>
  )
}
