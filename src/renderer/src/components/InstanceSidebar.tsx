import * as stylex from '@stylexjs/stylex'
import { Plus } from 'lucide-react'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import type { GameInstance, InstanceGroup } from '@shared/types'
import { Button } from './ui/button'
import { Plate } from './ui/plate'

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    height: '100%',
    minWidth: 280,
    padding: 16,
    width: 300
  },
  head: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between'
  },
  title: {
    color: colors.mutedForeground,
    fontSize: 12,
    letterSpacing: '0.08em',
    textTransform: 'uppercase'
  },
  list: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 8,
    overflow: 'auto'
  },
  row: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
    borderRadius: 18,
    borderStyle: 'solid',
    borderWidth: 1,
    color: colors.foreground,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '10px 12px',
    textAlign: 'left',
    width: '100%'
  },
  rowActive: {
    backgroundColor: colors.accent
  },
  name: {
    fontSize: 14,
    fontWeight: 500
  },
  meta: {
    color: colors.mutedForeground,
    fontSize: 12
  },
  empty: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 1.6,
    padding: 12
  }
})

export function InstanceSidebar({
  group,
  instances,
  selectedId,
  onSelect,
  onCreate
}: {
  group: InstanceGroup
  instances: GameInstance[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
}) {
  const rows = instances.filter((item) => item.group === group)
  return (
    <aside {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.head)}>
        <div {...stylex.props(styles.title)}>{t.instances}</div>
        <Button size="sm" variant="secondary" onClick={onCreate}>
          <Plus size={14} />
          {t.newInstance}
        </Button>
      </div>
      <div {...stylex.props(styles.list)}>
        {rows.length === 0 ? (
          <Plate>
            <p {...stylex.props(styles.empty)}>
              {group === 'modded' ? t.noInstancesModded : t.noInstancesVanilla}
            </p>
          </Plate>
        ) : (
          rows.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              {...stylex.props(styles.row, selectedId === item.id && styles.rowActive)}
            >
              <span {...stylex.props(styles.name)}>{item.name}</span>
              <span {...stylex.props(styles.meta)}>
                {item.versionId} · {item.versionType === 'snapshot' ? t.snapshot : t.releases}
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  )
}
