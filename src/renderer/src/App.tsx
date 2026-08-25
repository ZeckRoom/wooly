import { useEffect, useRef } from 'react'
import { Splash } from './components/Splash'
import { Shell } from './components/Shell'
import { gsap, prefersReducedMotion, useGSAP } from './lib/motion'
import { useLauncher } from './state/store'

function ShellIn() {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return
      gsap.from(root.current, { opacity: 0, duration: 0.32, ease: 'power2.out' })
    },
    { scope: root }
  )
  return (
    <div ref={root} style={{ height: '100%' }}>
      <Shell />
    </div>
  )
}

export default function App(): React.JSX.Element {
  const splash = useLauncher((s) => s.splash)
  const splashStatus = useLauncher((s) => s.splashStatus)
  const splashProgress = useLauncher((s) => s.splashProgress)
  const hydrate = useLauncher((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (splash) {
    return <Splash status={splashStatus} progress={splashProgress} />
  }
  return <ShellIn />
}
