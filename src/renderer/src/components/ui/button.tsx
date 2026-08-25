import * as stylex from '@stylexjs/stylex'
import type { StyleXStyles } from '@stylexjs/stylex'
import { colors, customClassName } from '../../lib/tokens.stylex'

const styles = stylex.create({
  base: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: '9999px',
    borderStyle: 'solid',
    borderWidth: 1,
    cursor: { ':disabled': 'not-allowed', default: 'pointer' },
    display: 'inline-flex',
    flexShrink: 0,
    fontSize: '0.875rem',
    fontWeight: 500,
    gap: '0.5rem',
    justifyContent: 'center',
    opacity: { ':disabled': 0.5, default: 1 },
    outline: 'none',
    pointerEvents: { ':disabled': 'none', default: null },
    transform: { ':active': 'translateY(1px) scale(0.98)', default: 'none' },
    transition: 'color 0.15s, background-color 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap'
  },
  default: {
    backgroundColor: {
      ':hover': 'color-mix(in srgb, var(--primary) 82%, white)',
      default: colors.primary
    },
    borderColor: 'var(--primary-edge)',
    color: colors.primaryForeground
  },
  destructive: {
    backgroundColor: {
      ':hover': 'color-mix(in srgb, var(--destructive) 88%, white)',
      default: colors.destructive
    },
    borderColor: 'var(--destructive-edge)',
    color: '#fff'
  },
  focusable: {
    boxShadow: {
      ':focus-visible': '0 0 0 3px color-mix(in srgb, var(--ring) 45%, transparent)',
      default: null
    }
  },
  ghost: {
    backgroundColor: { ':hover': colors.accent, default: 'transparent' },
    borderColor: 'transparent',
    color: { ':hover': colors.accentForeground, default: colors.foreground }
  },
  link: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: colors.success,
    textDecorationLine: { ':hover': 'underline', default: 'none' },
    textUnderlineOffset: '4px'
  },
  outline: {
    backgroundColor: { ':hover': colors.accent, default: 'transparent' },
    borderColor: colors.border,
    color: colors.foreground
  },
  secondary: {
    backgroundColor: {
      ':hover': 'color-mix(in srgb, var(--ink) 8%, var(--secondary))',
      default: colors.secondary
    },
    borderColor: colors.border,
    color: colors.secondaryForeground
  },
  sizeDefault: { height: '2.25rem', paddingInline: '1rem' },
  sizeIcon: { height: '2.25rem', paddingInline: 0, width: '2.25rem' },
  sizeIconLg: { height: '2.5rem', paddingInline: 0, width: '2.5rem' },
  sizeIconSm: { height: '2rem', paddingInline: 0, width: '2rem' },
  sizeLg: { height: '2.5rem', paddingInline: '1.25rem' },
  sizeSm: { height: '2rem', paddingInline: '0.75rem', fontSize: '0.75rem' }
})

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'

const variantStyles: Record<ButtonVariant, StyleXStyles> = {
  default: styles.default,
  destructive: styles.destructive,
  ghost: styles.ghost,
  link: styles.link,
  outline: styles.outline,
  secondary: styles.secondary
}

const sizeStyles: Record<ButtonSize, StyleXStyles> = {
  default: styles.sizeDefault,
  icon: styles.sizeIcon,
  'icon-lg': styles.sizeIconLg,
  'icon-sm': styles.sizeIconSm,
  lg: styles.sizeLg,
  sm: styles.sizeSm
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  sx?: StyleXStyles | Array<StyleXStyles | false | null | undefined>
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  type = 'button',
  sx,
  ...props
}: ButtonProps) {
  const extra = Array.isArray(sx) ? sx : [sx]
  return (
    <button
      type={type}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      {...props}
      {...stylex.props(
        styles.base,
        styles.focusable,
        variantStyles[variant],
        sizeStyles[size],
        ...extra,
        customClassName(className)
      )}
    />
  )
}
