import { useRef } from 'react'
import * as stylex from '@stylexjs/stylex'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import { gsap, prefersReducedMotion, useGSAP } from '@/lib/motion'
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
    backgroundImage: 'radial-gradient(circle at 30% 28%, #9ec0ff, #3d7dff 48%, #1f4fbf 100%)',
    borderRadius: '50%',
    boxShadow: '0 8px 32px rgb(61 125 255 / 0.22)',
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
  const root = useRef<HTMLDivElement>(null)
  const orb = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return
      const intro = root.current.querySelectorAll('[data-gsap-intro]')
      gsap.from(intro, {
        opacity: 0,
        y: 14,
        duration: 0.45,
        stagger: 0.07,
        ease: 'power2.out'
      })
      if (orb.current) {
        gsap.to(orb.current, {
          scale: 1.06,
          duration: 1.4,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut'
        })
      }
    },
    { scope: root }
  )

  return (
    <div ref={root} {...stylex.props(styles.root)}>
      <div data-gsap-intro {...stylex.props(styles.mark)}>
        <div ref={orb} aria-hidden="true" {...stylex.props(styles.orb)} />
        <div {...stylex.props(styles.tag)}>{t.splashTag}</div>
        <div {...stylex.props(styles.title)}>{t.appName}</div>
      </div>
      <div data-gsap-intro {...stylex.props(styles.bar)}>
        <Progress value={progress} />
      </div>
      <div data-gsap-intro role="status" {...stylex.props(styles.status)}>
        {status}
      </div>
    </div>
  )
}
