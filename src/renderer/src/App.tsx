import { useEffect, useRef } from 'react'
import { AppFrame } from './components/AppFrame'
import { Splash } from './components/Splash'
import { Shell } from './components/Shell'
import { gsap, prefersReducedMotion, useGSAP } from './lib/motion'
import { useLauncher } from './state/store'

function ShellIn() {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (!root.current) return
      if (prefersReducedMotion()) {
        gsap.set(root.current, { opacity: 1, y: 0 })
        return
      }
      gsap.fromTo(
        root.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.62, ease: 'power3.out' }
      )
    },
    { scope: root }
  )
  return (
    <div ref={root} className="flex h-full min-h-0 w-full flex-1 flex-col">
      <Shell />
    </div>
  )
}

export default function App(): React.JSX.Element {
  const splash = useLauncher((s) => s.splash)
  const splashProgress = useLauncher((s) => s.splashProgress)
  const hydrate = useLauncher((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return (
    <AppFrame>
      {splash ? (
        <Splash
          progress={splashProgress}
          onFinished={() => useLauncher.setState({ splash: false })}
        />
      ) : (
        <ShellIn />
      )}
    </AppFrame>
  )
}
