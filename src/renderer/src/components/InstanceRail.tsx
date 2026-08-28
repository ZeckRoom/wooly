import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { GameInstance, PublicAccount } from '@shared/types'
import { AccountChip } from './AccountChip'
import { Icon } from './ui/icon'

const TILE = ['#1e40af', '#166534', '#9a3412', '#6d28d9'] as const

function tileColor(value: string): string {
  let hash = 0
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return TILE[hash % TILE.length]!
}

function initialFor(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed[0]!.toLocaleUpperCase() : '?'
}

export function InstanceRail({
  instances,
  selectedId,
  account,
  onSelect,
  onCreate,
  onHome,
  onAccounts
}: {
  instances: GameInstance[]
  selectedId: string | null
  account: PublicAccount | null
  onSelect: (id: string) => void
  onCreate: () => void
  onHome: () => void
  onAccounts: () => void
}) {
  return (
    <aside
      className="flex h-full w-[var(--rail)] shrink-0 flex-col items-center gap-2 overflow-hidden border-r border-hairline bg-void pt-3 pb-3"
      aria-label={t.instances}
    >
      <button
        type="button"
        title={t.appProduct}
        aria-label={t.appProduct}
        onClick={onHome}
        className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary-edge bg-primary text-[18px] font-semibold tracking-[-0.04em] text-white italic"
      >
        W
      </button>
      <hr className="my-0.5 h-px w-8 shrink-0 border-0 bg-hairline" />
      <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-auto py-0.5">
        {instances.map((item) => {
          const active = item.id === selectedId
          return (
            <div key={item.id} className="relative flex w-full shrink-0 justify-center">
              {active ? (
                <span
                  aria-hidden
                  className="absolute top-1/2 left-0 h-10 w-1 -translate-y-1/2 rounded-r bg-ink"
                />
              ) : null}
              <button
                type="button"
                title={item.name}
                aria-current={active}
                aria-label={item.name}
                onClick={() => onSelect(item.id)}
                style={{ backgroundColor: tileColor(item.id) }}
                className={cn(
                  'flex size-12 items-center justify-center overflow-hidden rounded-full text-base font-semibold text-white transition-[border-radius] duration-200 ease-out hover:rounded-2xl',
                  active && 'rounded-2xl'
                )}
              >
                {initialFor(item.name)}
              </button>
            </div>
          )
        })}
        <button
          type="button"
          title={t.newInstance}
          aria-label={t.newInstance}
          onClick={onCreate}
          className="flex size-12 shrink-0 items-center justify-center rounded-full border border-hairline bg-transparent text-success transition-[border-radius,background-color] duration-200 ease-out hover:rounded-2xl hover:border-primary-edge hover:bg-primary hover:text-white"
        >
          <Icon icon={PlusSignIcon} size={22} />
        </button>
      </div>
      <div className="shrink-0 pt-2">
        <AccountChip account={account} onClick={onAccounts} />
      </div>
    </aside>
  )
}
