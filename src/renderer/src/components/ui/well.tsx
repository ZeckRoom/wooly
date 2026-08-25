import * as stylex from '@stylexjs/stylex'
import type { StyleXStyles } from '@stylexjs/stylex'
import { colors } from '../../lib/tokens.stylex'

const styles = stylex.create({
  root: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderStyle: 'solid',
    borderWidth: 1
  }
})

/** One surface. Do not nest Wells. */
export function Well({
  children,
  sx
}: {
  children: React.ReactNode
  sx?: StyleXStyles
}) {
  return <section {...stylex.props(styles.root, sx)}>{children}</section>
}
