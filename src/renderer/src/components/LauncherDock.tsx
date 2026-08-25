import { useEffect, useRef, useState } from 'react'
import * as stylex from '@stylexjs/stylex'
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon'
import PlayIcon from '@hugeicons/core-free-icons/PlayIcon'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import Settings01Icon from '@hugeicons/core-free-icons/Settings01Icon'
import StopIcon from '@hugeicons/core-free-icons/StopIcon'
import { colors, customClassName } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import { gsap, prefersReducedMotion, useGSAP } from '@/lib/motion'
import type { AppUpdateState, CatalogVersion, GameInstance, LaunchState } from '@shared/types'
import { Icon } from './ui/icon'
import { UpdateBanner } from './UpdateBanner'

const styles = stylex.create({
  cluster: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    pointerEvents: 'auto',
    position: 'relative',
    width: 360,
    zIndex: 21
  },
  overlay: {
    backgroundColor: 'rgb(0 0 0 / 0.45)',
    borderStyle: 'none',
    bottom: 0,
    cursor: 'default',
    left: 'var(--rail)',
    pointerEvents: 'auto',
    position: 'fixed',
    right: 0,
    top: 'var(--titlebar)',
    zIndex: 20
  },
  panel: {
    borderRadius: 16,
    color: colors.foreground,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'min(420px, calc(100vh - 180px))',
    opacity: 0,
    overflow: 'hidden',
    width: '100%'
  },
  header: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '14px 16px 10px 20px'
  },
  kicker: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.12em',
    textTransform: 'uppercase'
  },
  close: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: colors.border,
    borderRadius: 999,
    borderStyle: 'solid',
    borderWidth: 1,
    color: colors.foreground,
    cursor: 'pointer',
    display: 'flex',
    height: 32,
    justifyContent: 'center',
    width: 32
  },
  items: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'auto',
    padding: '4px 8px 8px'
  },
  item: {
    backgroundColor: {
      ':hover': 'rgb(255 255 255 / 0.05)',
      default: 'transparent'
    },
    borderRadius: 10,
    borderStyle: 'none',
    color: colors.foreground,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    font: 'inherit',
    gap: 2,
    padding: '10px 12px',
    textAlign: 'left',
    width: '100%'
  },
  itemActive: {
    backgroundColor: 'rgb(255 255 255 / 0.07)'
  },
  itemRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10
  },
  name: {
    fontSize: 15,
    fontWeight: 500
  },
  meta: {
    color: colors.mutedForeground,
    fontFamily: "'Geist Mono Variable', ui-monospace, Consolas, monospace",
    fontSize: 12
  },
  empty: {
    color: colors.mutedForeground,
    fontSize: 13,
    padding: '12px 12px 16px'
  },
  rule: {
    backgroundColor: colors.border,
    borderStyle: 'none',
    height: 1,
    margin: '4px 16px',
    width: 'auto'
  },
  foot: {
    padding: '4px 8px 10px'
  },
  dock: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 999,
    display: 'flex',
    gap: 8,
    minHeight: 56,
    padding: 6,
    width: 'auto'
  },
  version: {
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: colors.chip,
    borderRadius: 999,
    borderStyle: 'none',
    color: colors.chipForeground,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    fontFamily: "'Geist Mono Variable', ui-monospace, Consolas, monospace",
    fontSize: 12,
    fontWeight: 500,
    height: 40,
    justifyContent: 'center',
    letterSpacing: '0.02em',
    minWidth: 40,
    padding: '0 14px',
    WebkitAppearance: 'none',
    whiteSpace: 'nowrap'
  },
  round: {
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: colors.primary,
    borderColor: 'var(--primary-edge)',
    borderRadius: 999,
    borderStyle: 'solid',
    borderWidth: 1,
    color: colors.primaryForeground,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    height: 44,
    justifyContent: 'center',
    WebkitAppearance: 'none',
    width: 44
  },
  play: {
    backgroundColor: {
      ':disabled': 'color-mix(in srgb, var(--primary) 55%, transparent)',
      ':hover': 'color-mix(in srgb, white 12%, var(--primary))',
      default: colors.primary
    },
    opacity: { ':disabled': 0.7, default: 1 }
  },
  stop: {
    backgroundColor: {
      ':hover': 'color-mix(in srgb, white 12%, var(--destructive))',
      default: colors.destructive
    },
    borderColor: 'var(--destructive-edge)'
  }
})

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
  settingsActive,
  update,
  onPlay,
  onStop,
  onSelect,
  onCreate,
  onSettings,
  onUpdateCheck,
  onUpdateDownload,
  onUpdateInstall
}: {
  instances: GameInstance[]
  selected: GameInstance | null
  versions: CatalogVersion[]
  launch: LaunchState
  settingsActive: boolean
  update: AppUpdateState
  onPlay: () => void
  onStop: () => void
  onSelect: (id: string) => void
  onCreate: () => void
  onSettings: () => void
  onUpdateCheck: () => void
  onUpdateDownload: () => void
  onUpdateInstall: () => void
}) {
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const latestVersion =
    versions.find((item) => item.latestRelease)?.id ?? versions[0]?.id ?? ''
  const versionLabel = selected?.versionId ?? latestVersion
  const busy = Boolean(selected && launch.phase !== 'idle' && launch.instanceId === selected.id)
  const running = Boolean(selected && launch.phase === 'running' && launch.instanceId === selected.id)
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
        <div role="presentation" onClick={hide} {...stylex.props(styles.overlay)} />
      ) : null}
      <div {...stylex.props(styles.cluster)}>
        {shown ? (
          <div
            ref={panel}
            role="dialog"
            aria-label={t.instances}
            {...stylex.props(styles.panel, customClassName('wooly-glass'))}
          >
            <div {...stylex.props(styles.header)}>
              <span data-dock-item {...stylex.props(styles.kicker)}>
                {t.instances}
              </span>
              <button
                type="button"
                aria-label={t.close}
                onClick={hide}
                {...stylex.props(styles.close)}
              >
                <Icon icon={Cancel01Icon} size={14} />
              </button>
            </div>
            <div {...stylex.props(styles.items)}>
              <button
                type="button"
                data-dock-item
                onClick={() => {
                  hide()
                  onCreate()
                }}
                {...stylex.props(styles.item, styles.itemRow)}
              >
                <Icon icon={PlusSignIcon} size={16} />
                <span {...stylex.props(styles.name)}>{t.newInstance}</span>
              </button>
              {instances.length === 0 ? (
                <p data-dock-item {...stylex.props(styles.empty)}>
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
                    {...stylex.props(styles.item, selected?.id === item.id && styles.itemActive)}
                  >
                    <span {...stylex.props(styles.name)}>{item.name}</span>
                    <span {...stylex.props(styles.meta)}>
                      {item.versionId} · {item.versionType === 'snapshot' ? t.snapshot : t.releases}
                    </span>
                  </button>
                ))
              )}
            </div>
            <hr {...stylex.props(styles.rule)} />
            <div {...stylex.props(styles.foot)}>
              <button
                type="button"
                data-dock-item
                onClick={() => {
                  hide()
                  onSettings()
                }}
                {...stylex.props(styles.item, styles.itemRow, settingsActive && styles.itemActive)}
              >
                <Icon icon={Settings01Icon} size={16} />
                <span {...stylex.props(styles.name)}>{t.settings}</span>
              </button>
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
        <div {...stylex.props(styles.dock, customClassName('wooly-glass'))}>
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => (open ? hide() : show())}
            {...stylex.props(styles.version)}
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
            {...stylex.props(styles.round, styles.play, running && styles.stop)}
          >
            <Icon icon={running ? StopIcon : PlayIcon} size={18} />
          </button>
        </div>
      </div>
    </>
  )
}
