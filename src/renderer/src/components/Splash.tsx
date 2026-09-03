import { useRef } from 'react'
import { t } from '@/lib/i18n'
import { gsap, prefersReducedMotion, useGSAP } from '@/lib/motion'

export function Splash({ progress, onFinished }: { progress: number; onFinished: () => void }) {
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
      className="flex h-full min-h-0 w-full flex-1 flex-col justify-center bg-void"
    >
      <div className="h-[3px] w-full overflow-hidden">
        <div ref={bar} className="h-full w-full origin-left scale-x-0 bg-success" />
      </div>
    </div>
  )
}
