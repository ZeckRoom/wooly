import * as stylex from '@stylexjs/stylex'
import type { StyleXStyles } from '@stylexjs/stylex'

/**
 * Design tokens for the StyleX component set.
 * Maps CSS variables so theming stays in globals.css (cool charcoal + blue).
 */
export const colors = stylex.defineVars({
  accent: 'var(--accent)',
  accentForeground: 'var(--accent-foreground)',
  background: 'var(--background)',
  border: 'var(--border)',
  card: 'var(--card)',
  cardForeground: 'var(--card-foreground)',
  destructive: 'var(--destructive)',
  foreground: 'var(--foreground)',
  input: 'var(--input)',
  muted: 'var(--muted)',
  mutedForeground: 'var(--muted-foreground)',
  popover: 'var(--popover)',
  popoverForeground: 'var(--popover-foreground)',
  primary: 'var(--primary)',
  primaryForeground: 'var(--primary-foreground)',
  ring: 'var(--ring)',
  secondary: 'var(--secondary)',
  secondaryForeground: 'var(--secondary-foreground)',
  sidebar: 'var(--sidebar)',
  sidebarAccent: 'var(--sidebar-accent)',
  sidebarAccentForeground: 'var(--sidebar-accent-foreground)',
  sidebarBorder: 'var(--sidebar-border)',
  sidebarForeground: 'var(--sidebar-foreground)',
  sidebarPrimary: 'var(--sidebar-primary)',
  sidebarPrimaryForeground: 'var(--sidebar-primary-foreground)',
  sidebarRing: 'var(--sidebar-ring)',
  info: 'var(--info)',
  infoForeground: 'var(--info-foreground)',
  success: 'var(--success)',
  successForeground: 'var(--success-foreground)'
})

export const radius = stylex.defineVars({
  lg: 'var(--radius)',
  md: 'calc(var(--radius) - 2px)',
  sm: 'calc(var(--radius) - 4px)',
  xl: 'calc(var(--radius) + 4px)'
})

export function customClassName(className?: string): StyleXStyles | undefined {
  return className ? ({ className } as StyleXStyles) : undefined
}
