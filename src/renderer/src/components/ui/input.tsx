import * as stylex from '@stylexjs/stylex'
import { colors, customClassName } from '@/lib/tokens.stylex'

const styles = stylex.create({
  root: {
    backgroundColor: 'transparent',
    borderColor: colors.input,
    borderRadius: '9999px',
    borderStyle: 'solid',
    borderWidth: 1,
    color: colors.foreground,
    fontSize: '0.875rem',
    height: '2.25rem',
    outline: 'none',
    paddingInline: '0.9rem',
    width: '100%',
    boxShadow: {
      ':focus-visible': '0 0 0 3px color-mix(in srgb, var(--ring) 45%, transparent)',
      default: 'none'
    }
  }
})

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} {...stylex.props(styles.root, customClassName(className))} />
}
