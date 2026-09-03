import { useMemo, useState } from 'react'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
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
import { Slider } from './ui/slider'

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
      <div className="flex min-h-0 flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
            {t.name}
          </span>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
            {t.version}
          </span>
          <Input
            value={query}
            placeholder={t.searchVersions}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="flex gap-2">
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
        <div className="max-h-[180px] overflow-auto">
          {filtered.slice(0, 40).map((version) => (
            <button
              key={version.id}
              type="button"
              onClick={() => setDraft({ ...draft, versionId: version.id })}
              className={cn(
                'block w-full border-b border-hairline bg-transparent py-2.5 pr-1 pl-1 text-left font-mono text-[13px] tabular-nums text-ink [@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/[0.05]',
                draft.versionId === version.id && 'text-success'
              )}
            >
              {version.id}
              {version.latestRelease ? ` · ${t.latest}` : ''}
              {version.latestSnapshot ? ` · ${t.snapshot}` : ''}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium tracking-[0.08em] text-muted uppercase tabular-nums">
            {t.maxMemory}: {draft.memoryMaxMb ?? DEFAULT_MEMORY_MAX} {t.mb}
          </span>
          <Slider
            min={MEMORY_STEP}
            max={MEMORY_SLIDER_MAX}
            step={MEMORY_STEP}
            value={draft.memoryMaxMb ?? DEFAULT_MEMORY_MAX}
            aria-label={t.maxMemory}
            onValueChange={(memoryMaxMb) =>
              setDraft({ ...draft, memoryMaxMb: snapMemoryMb(memoryMaxMb) })
            }
          />
        </label>
        {error ? <p className="text-[13px] text-destructive">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
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
