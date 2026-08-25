import * as stylex from '@stylexjs/stylex'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import { Progress } from './ui/progress'

const styles = stylex.create({
  root: {
    alignItems: 'center',
    backgroundColor: colors.background,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
    gap: 28
  },
  mark: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 14
  },
  orb: {
    backgroundImage: 'radial-gradient(circle at 30% 28%, #f3e0c4, #d4b48c 42%, #9a7a52 100%)',
    borderRadius: '50%',
    boxShadow: '0 8px 32px rgb(212 180 140 / 0.18)',
    height: 72,
    width: 72
  },
  title: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: 500,
    letterSpacing: '-0.04em'
  },
  tag: {
    color: colors.mutedForeground,
    fontSize: 12,
    letterSpacing: '0.12em',
    textTransform: 'uppercase'
  },
  status: {
    color: colors.mutedForeground,
    fontSize: 13
  },
  bar: {
    width: 220
  }
})

export function Splash({ status, progress }: { status: string; progress: number }) {
  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.mark)}>
        <div aria-hidden="true" {...stylex.props(styles.orb)} />
        <div {...stylex.props(styles.tag)}>{t.splashTag}</div>
        <div {...stylex.props(styles.title)}>{t.appName}</div>
      </div>
      <div {...stylex.props(styles.bar)}>
        <Progress value={progress} />
      </div>
      <div role="status" {...stylex.props(styles.status)}>
        {status}
      </div>
    </div>
  )
}
