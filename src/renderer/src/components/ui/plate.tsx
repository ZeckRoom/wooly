import * as stylex from '@stylexjs/stylex'
import { colors } from '../../lib/tokens.stylex'

const styles = stylex.create({
  outer: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 26,
    borderStyle: 'solid',
    borderWidth: 1,
    boxShadow: '0 1px 2px rgb(0 0 0 / 0.18)',
    padding: 4
  },
  inner: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 22,
    borderStyle: 'solid',
    borderWidth: 1,
    overflow: 'hidden'
  },
  flat: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 22,
    borderStyle: 'solid',
    borderWidth: 1,
    boxShadow: '0 1px 2px rgb(0 0 0 / 0.18)'
  },
  flatBare: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 0,
    boxShadow: 'none'
  }
})

export function Plate({
  children,
  inset = false,
  bordered = true
}: {
  children: React.ReactNode
  inset?: boolean
  bordered?: boolean
}) {
  if (!inset) {
    return <section {...stylex.props(bordered ? styles.flat : styles.flatBare)}>{children}</section>
  }
  return (
    <section {...stylex.props(styles.outer)}>
      <div {...stylex.props(styles.inner)}>{children}</div>
    </section>
  )
}
