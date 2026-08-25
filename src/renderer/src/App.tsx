import { useEffect } from 'react'
import { Splash } from './components/Splash'
import { Shell } from './components/Shell'
import { useLauncher } from './state/store'

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
  return <Shell />
}
