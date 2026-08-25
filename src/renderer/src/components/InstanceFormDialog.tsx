import { useMemo, useState } from 'react'
import * as stylex from '@stylexjs/stylex'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import { filterCatalog } from '@shared/minecraft'
import {
  DEFAULT_MEMORY_MAX,
  MEMORY_SLIDER_MAX,
  MEMORY_STEP,
  defaultInstanceDraft,
  snapMemoryMb,
  validateInstanceDraft
} from '@shared/instance'
import type {
  CatalogVersion,
  GameInstance,
  InstanceDraft,
  InstanceGroup,
  VersionChannel
} from '@shared/types'
import { Button } from './ui/button'
import { Dialog } from './ui/dialog'
import { Input } from './ui/input'

const styles = stylex.create({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minHeight: 0
  },
  label: {
    color: colors.mutedForeground,
    fontSize: 12
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  row: {
    display: 'flex',
    gap: 8
  },
  list: {
    borderColor: colors.border,
    borderRadius: 16,
    borderStyle: 'solid',
    borderWidth: 1,
    maxHeight: 180,
    overflow: 'auto'
  },
  option: {
    backgroundColor: 'transparent',
    borderStyle: 'none',
    color: colors.foreground,
    cursor: 'pointer',
    display: 'block',
    fontSize: 13,
    padding: '8px 12px',
    textAlign: 'left',
    width: '100%'
  },
  optionActive: {
    backgroundColor: colors.accent
  },
  error: {
    color: colors.destructive,
    fontSize: 13
  },
  footer: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
    paddingTop: 8
  }
})

export function InstanceFormDialog({
  open,
  group,
  versions,
  existing,
  instance,
  onClose,
  onSubmit
}: {
  open: boolean
  group: InstanceGroup
  versions: CatalogVersion[]
  existing: GameInstance[]
  instance?: GameInstance | null
  onClose: () => void
  onSubmit: (draft: InstanceDraft) => Promise<void>
}) {
  const defaults = instance
    ? {
        name: instance.name,
        group: instance.group,
        versionId: instance.versionId,
        memoryMaxMb: snapMemoryMb(instance.memoryMaxMb),
        memoryMinMb: instance.memoryMinMb,
        jvmArgs: instance.jvmArgs,
        width: instance.width,
        height: instance.height,
        fullscreen: instance.fullscreen
      }
    : defaultInstanceDraft(
        group,
        versions.find((v) => v.latestRelease)?.id ?? versions[0]?.id ?? ''
      )

  const [draft, setDraft] = useState<InstanceDraft>(defaults)
  const [query, setQuery] = useState('')
  const [channel, setChannel] = useState<VersionChannel | 'all'>(
    instance?.versionType === 'snapshot' ? 'snapshot' : 'release'
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(
    () => filterCatalog(versions, query, channel),
    [versions, query, channel]
  )

  const submit = async () => {
    const check = validateInstanceDraft(
      draft,
      existing.map((item) => item.name),
      { currentName: instance?.name }
    )
    if (!check.ok) {
      setError(check.errors[0])
      return
    }
    setBusy(true)
    try {
      await onSubmit(draft)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} title={instance ? t.editTitle : t.createTitle} onClose={onClose}>
      <div {...stylex.props(styles.form)}>
        <label {...stylex.props(styles.field)}>
          <span {...stylex.props(styles.label)}>{t.name}</span>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <label {...stylex.props(styles.field)}>
          <span {...stylex.props(styles.label)}>{t.version}</span>
          <Input
            value={query}
            placeholder={t.searchVersions}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div {...stylex.props(styles.row)}>
          {(['release', 'snapshot', 'all'] as const).map((item) => (
            <Button
              key={item}
              size="sm"
              variant={channel === item ? 'secondary' : 'ghost'}
              onClick={() => setChannel(item)}
            >
              {item === 'release' ? t.releases : item === 'snapshot' ? t.snapshots : t.all}
            </Button>
          ))}
        </div>
        <div {...stylex.props(styles.list)}>
          {filtered.slice(0, 40).map((version) => (
            <button
              key={version.id}
              type="button"
              onClick={() => setDraft({ ...draft, versionId: version.id })}
              {...stylex.props(
                styles.option,
                draft.versionId === version.id && styles.optionActive
              )}
            >
              {version.id}
              {version.latestRelease ? ` · ${t.latest}` : ''}
              {version.latestSnapshot ? ` · ${t.snapshot}` : ''}
            </button>
          ))}
        </div>
        <label {...stylex.props(styles.field)}>
          <span {...stylex.props(styles.label)}>
            {t.maxMemory}: {draft.memoryMaxMb ?? DEFAULT_MEMORY_MAX} {t.mb}
          </span>
          <input
            type="range"
            min={MEMORY_STEP}
            max={MEMORY_SLIDER_MAX}
            step={MEMORY_STEP}
            value={draft.memoryMaxMb ?? DEFAULT_MEMORY_MAX}
            onChange={(e) =>
              setDraft({ ...draft, memoryMaxMb: snapMemoryMb(Number(e.target.value)) })
            }
          />
        </label>
        {error ? <p {...stylex.props(styles.error)}>{error}</p> : null}
        <div {...stylex.props(styles.footer)}>
          <Button variant="secondary" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button onClick={() => void submit()} disabled={busy}>
            {instance ? t.save : t.create}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
