import { useEffect, useRef, useState } from 'react'
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon'
import PlayIcon from '@hugeicons/core-free-icons/PlayIcon'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import StopIcon from '@hugeicons/core-free-icons/StopIcon'
import { glass, kicker } from '@/lib/chrome'
import { t } from '@/lib/i18n'
import { gsap, prefersReducedMotion, useGSAP } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { AppUpdateState, CatalogVersion, GameInstance, LaunchState } from '@shared/types'
import { Icon } from './ui/icon'
import { UpdateBanner } from './UpdateBanner'

function playLabel(phase: LaunchState['phase']): string {
  if (phase === 'installing') return t.installing
  if (phase === 'launching') return t.launching
  if (phase === 'running') return t.stop
  if (phase === 'stopping') return t.stop
  return t.play
}

export function LauncherDock({
  instances,
  selected,
  versions,
  launch,
  update,
  onPlay,
  onStop,
  onSelect,
  onCreate,
  onUpdateCheck,
  onUpdateDownload,
  onUpdateInstall
}: {
  instances: GameInstance[]
  selected: GameInstance | null
  versions: CatalogVersion[]
  launch: LaunchState
  update: AppUpdateState
  onPlay: () => void
  onStop: () => void
  onSelect: (id: string) => void
  onCreate: () => void
  onUpdateCheck: () => void
  onUpdateDownload: () => void
  onUpdateInstall: () => void
}) {
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const latestVersion = versions.find((item) => item.latestRelease)?.id ?? versions[0]?.id ?? ''
  const versionLabel = selected?.versionId ?? latestVersion
  const busy = Boolean(selected && launch.phase !== 'idle' && launch.instanceId === selected.id)
  const running = Boolean(
    selected && launch.phase === 'running' && launch.instanceId === selected.id
  )
  const locked = busy && !running

  const show = () => {
    setShown(true)
    setOpen(true)
  }
  const hide = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useGSAP(
    () => {
      const reduced = prefersReducedMotion()
      if (!shown || !panel.current) return
      gsap.killTweensOf(panel.current)
      if (open) {
        if (reduced) {
          gsap.set(panel.current, { opacity: 1, y: 0, scale: 1 })
          return
        }
        gsap.fromTo(
          panel.current,
          { opacity: 0, y: 28, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.48,
            ease: 'power3.out',
            transformOrigin: '50% 100%'
          }
        )
        const rows = panel.current.querySelectorAll('[data-dock-item]')
        if (rows.length > 0) {
          gsap.fromTo(
            rows,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.32, stagger: 0.04, delay: 0.08, ease: 'power2.out' }
          )
        }
        return
      }
      if (reduced) {
        setShown(false)
        return
      }
      gsap.to(panel.current, {
        opacity: 0,
        y: 18,
        scale: 0.94,
        duration: 0.26,
        ease: 'power2.in',
        transformOrigin: '50% 100%',
        onComplete: () => setShown(false)
      })
    },
    { dependencies: [open, shown], revertOnUpdate: false }
  )

  const phase = selected && launch.instanceId === selected.id ? launch.phase : 'idle'

  return (
    <>
      {shown ? (
        <div
          role="presentation"
          onClick={hide}
          className="pointer-events-auto fixed top-[var(--titlebar)] right-0 bottom-0 left-[var(--rail)] z-20 cursor-default bg-black/45"
        />
      ) : null}
      <div className="pointer-events-auto relative z-21 flex w-[360px] flex-col items-center gap-3">
        {shown ? (
          <div
            ref={panel}
            role="dialog"
            aria-label={t.instances}
            className={cn(
              'flex max-h-[min(420px,calc(100vh-180px))] w-full flex-col overflow-hidden rounded-2xl text-ink opacity-0',
              glass
            )}
          >
            <div className="flex items-center justify-between px-5 pt-3.5 pr-4 pb-2.5">
              <span data-dock-item className={kicker}>
                {t.instances}
              </span>
              <button
                type="button"
                aria-label={t.close}
                onClick={hide}
                className="flex size-8 items-center justify-center rounded-full border border-hairline bg-transparent text-ink"
              >
                <Icon icon={Cancel01Icon} size={14} />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-auto px-2 pt-1 pb-2">
              <button
                type="button"
                data-dock-item
                onClick={() => {
                  hide()
                  onCreate()
                }}
                className="flex w-full flex-row items-center gap-2.5 rounded-[10px] bg-transparent px-3 py-2.5 text-left text-ink hover:bg-white/[0.05]"
              >
                <Icon icon={PlusSignIcon} size={16} />
                <span className="text-[15px] font-medium">{t.newInstance}</span>
              </button>
              {instances.length === 0 ? (
                <p data-dock-item className="px-3 pt-3 pb-4 text-[13px] text-muted">
                  {t.noInstances}
                </p>
              ) : (
                instances.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    data-dock-item
                    onClick={() => {
                      hide()
                      onSelect(item.id)
                    }}
                    className={cn(
                      'flex w-full flex-col gap-0.5 rounded-[10px] bg-transparent px-3 py-2.5 text-left text-ink hover:bg-white/[0.05]',
                      selected?.id === item.id && 'bg-white/[0.07]'
                    )}
                  >
                    <span className="text-[15px] font-medium">{item.name}</span>
                    <span className="font-mono text-xs text-muted">
                      {item.versionId} · {item.versionType === 'snapshot' ? t.snapshot : t.releases}
                    </span>
                  </button>
                ))
              )}
            </div>
            <hr className="mx-4 my-1 h-px border-0 bg-hairline" />
            <div className="px-2 pt-1 pb-2.5">
              <div data-dock-item>
                <UpdateBanner
                  update={update}
                  onCheck={onUpdateCheck}
                  onDownload={onUpdateDownload}
                  onInstall={onUpdateInstall}
                />
              </div>
            </div>
          </div>
        ) : null}
        <div
          className={cn(
            'flex min-h-14 w-auto items-center gap-2 self-center rounded-full p-1.5',
            glass
          )}
        >
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => (open ? hide() : show())}
            className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full bg-chip px-3.5 font-mono text-xs font-medium tracking-[0.02em] whitespace-nowrap text-chip-fg"
          >
            {versionLabel}
          </button>
          <button
            type="button"
            aria-label={playLabel(phase)}
            disabled={locked}
            onClick={() => {
              if (!selected) {
                show()
                return
              }
              if (running) onStop()
              else onPlay()
            }}
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-full border border-solid disabled:opacity-70',
              running
                ? 'border-destructive-edge bg-destructive hover:brightness-110'
                : 'border-primary-edge bg-primary hover:enabled:brightness-110 disabled:bg-primary/55'
            )}
          >
            <Icon icon={running ? StopIcon : PlayIcon} size={18} />
          </button>
        </div>
      </div>
    </>
  )
}
