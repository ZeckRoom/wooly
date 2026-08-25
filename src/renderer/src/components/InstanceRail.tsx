import * as stylex from '@stylexjs/stylex'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import type { GameInstance } from '@shared/types'
import { Icon } from './ui/icon'

const styles = stylex.create({
  root: {
    alignItems: 'center',
    backgroundColor: colors.sidebar,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    gap: 8,
    height: '100%',
    overflow: 'hidden',
    padding: '12px 0 12px',
    width: 'var(--rail)'
  },
  home: {
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: colors.primary,
    borderRadius: 16,
    borderStyle: 'none',
    color: colors.primaryForeground,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    font: 'inherit',
    fontSize: 18,
    fontWeight: 600,
    height: 48,
    justifyContent: 'center',
    letterSpacing: '-0.04em',
    width: 48
  },
  rule: {
    backgroundColor: 'rgb(255 255 255 / 0.12)',
    borderStyle: 'none',
    flexShrink: 0,
    height: 2,
    margin: '2px 0',
    width: 32
  },
  list: {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 8,
    minHeight: 0,
    overflow: 'auto',
    padding: '2px 0',
    width: '100%'
  },
  slot: {
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    position: 'relative',
    width: '100%'
  },
  pip: {
    backgroundColor: colors.foreground,
    borderRadius: '0 4px 4px 0',
    height: 40,
    left: 0,
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 4
  },
  tile: {
    alignItems: 'center',
    appearance: 'none',
    borderRadius: {
      ':hover': 16,
      default: 999
    },
    borderStyle: 'none',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    font: 'inherit',
    fontSize: 16,
    fontWeight: 600,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    transition: 'border-radius 0.18s var(--ease-out)',
    width: 48
  },
  tileActive: {
    borderRadius: 16
  },
  add: {
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: {
      ':hover': colors.success,
      default: colors.secondary
    },
    borderRadius: {
      ':hover': 16,
      default: 999
    },
    borderStyle: 'none',
    color: {
      ':hover': colors.successForeground,
      default: colors.success
    },
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    height: 48,
    justifyContent: 'center',
    marginTop: 4,
    transition: 'border-radius 0.18s var(--ease-out), background-color 0.18s var(--ease-out)',
    width: 48
  }
})

function hueFrom(value: string): number {
  let hash = 0
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash % 360
}

function initialFor(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed[0]!.toLocaleUpperCase() : '?'
}

export function InstanceRail({
  instances,
  selectedId,
  onSelect,
  onCreate,
  onHome
}: {
  instances: GameInstance[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onHome: () => void
}) {
  return (
    <aside {...stylex.props(styles.root)} aria-label={t.instances}>
      <button
        type="button"
        title={t.appProduct}
        aria-label={t.appProduct}
        onClick={onHome}
        {...stylex.props(styles.home)}
      >
        W
      </button>
      <hr {...stylex.props(styles.rule)} />
      <div {...stylex.props(styles.list)}>
        {instances.map((item) => {
          const active = item.id === selectedId
          return (
            <div key={item.id} {...stylex.props(styles.slot)}>
              {active ? <span aria-hidden {...stylex.props(styles.pip)} /> : null}
              <button
                type="button"
                title={item.name}
                aria-current={active}
                aria-label={item.name}
                onClick={() => onSelect(item.id)}
                style={{ backgroundColor: `hsl(${hueFrom(item.id)} 54% 38%)` }}
                {...stylex.props(styles.tile, active && styles.tileActive)}
              >
                {initialFor(item.name)}
              </button>
            </div>
          )
        })}
      </div>
      <button
        type="button"
        title={t.newInstance}
        aria-label={t.newInstance}
        onClick={onCreate}
        {...stylex.props(styles.add)}
      >
        <Icon icon={PlusSignIcon} size={22} />
      </button>
    </aside>
  )
}
