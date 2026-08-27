import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'

export function Icon({ icon, size = 16 }: { icon: IconSvgElement; size?: number }) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color="currentColor"
      strokeWidth={1.5}
      className="block shrink-0"
    />
  )
}
