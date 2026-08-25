import { useRef } from 'react'
import * as stylex from '@stylexjs/stylex'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import { gsap, prefersReducedMotion, useGSAP } from '@/lib/motion'

const styles = stylex.create({
  root: {
    backgroundColor: colors.background,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
    width: '100%'
  },
  track: {
    height: 3,
    overflow: 'hidden',
    width: '100%'
  },
  bar: {
    backgroundColor: colors.success,
    height: '100%',
    transform: 'scaleX(0)',
    transformOrigin: 'left center',
    width: '100%'
  }
})

export function Splash({
  progress,
  onFinished
}: {
  progress: number
  onFinished: () => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const done = useRef(false)

  useGSAP(
    () => {
      if (!bar.current) return
      const reduced = prefersReducedMotion()
      const target = Math.max(0, Math.min(100, progress)) / 100
      const finish = () => {
        if (done.current) return
        done.current = true
        if (reduced || !root.current) {
          onFinished()
          return
        }
        gsap.to(root.current, {
          opacity: 0,
          duration: 0.42,
          ease: 'power2.inOut',
          onComplete: onFinished
        })
      }

      if (reduced) {
        gsap.set(bar.current, { scaleX: target })
        if (progress >= 100) finish()
        return
      }

      gsap.to(bar.current, {
        scaleX: target,
        duration: progress >= 100 ? 0.55 : 0.4,
        ease: progress >= 100 ? 'power2.inOut' : 'power1.out',
        overwrite: 'auto',
        transformOrigin: 'left center',
        onComplete: () => {
          if (progress >= 100) finish()
        }
      })
    },
    { dependencies: [progress], revertOnUpdate: false }
  )

  return (
    <div
      ref={root}
      role="progressbar"
      aria-label={t.splashDefault}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.max(0, Math.min(100, progress))}
      {...stylex.props(styles.root)}
    >
      <div {...stylex.props(styles.track)}>
        <div ref={bar} {...stylex.props(styles.bar)} />
      </div>
    </div>
  )
}
