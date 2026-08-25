import * as stylex from '@stylexjs/stylex'
import { colors, customClassName } from '../../lib/tokens.stylex'

const styles = stylex.create({
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%'
  },
  track: {
    backgroundColor: 'color-mix(in srgb, var(--success) 18%, transparent)',
    borderRadius: '9999px',
    height: '0.35rem',
    overflow: 'hidden',
    position: 'relative',
    width: '100%'
  },
  bar: {
    backgroundColor: colors.success,
    height: '100%',
    transition: 'width 0.2s ease-out'
  },
  label: {
    color: colors.mutedForeground,
    fontFamily: "'Geist Mono Variable', ui-monospace, Consolas, monospace",
    fontSize: '0.75rem'
  }
})

export function Progress({
  value = 0,
  label,
  className
}: {
  value?: number
  label?: string
  className?: string
}) {
  const width = Math.max(0, Math.min(100, value))
  return (
    <div
      {...stylex.props(styles.wrap, customClassName(className))}
      role="progressbar"
      aria-valuenow={width}
    >
      {label ? <div {...stylex.props(styles.label)}>{label}</div> : null}
      <div {...stylex.props(styles.track)}>
        <div {...stylex.props(styles.bar)} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}
