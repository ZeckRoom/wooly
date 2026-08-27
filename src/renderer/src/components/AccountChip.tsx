import UserIcon from '@hugeicons/core-free-icons/UserIcon'
import { t } from '@/lib/i18n'
import type { PublicAccount } from '@shared/types'
import { Icon } from './ui/icon'

export function AccountChip({
  account,
  onClick
}: {
  account: PublicAccount | null
  onClick: () => void
}) {
  const label = account?.username ?? t.logIn
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex w-14 flex-col items-center gap-1 bg-transparent p-0 text-ink"
    >
      {account ? (
        <img
          alt=""
          src={account.avatarUrl}
          className="size-12 shrink-0 rounded-full border border-hairline object-cover"
        />
      ) : (
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-secondary text-ink">
          <Icon icon={UserIcon} size={18} />
        </span>
      )}
      <span className="max-w-full truncate text-center text-[11px] font-medium text-muted">
        {label}
      </span>
    </button>
  )
}
