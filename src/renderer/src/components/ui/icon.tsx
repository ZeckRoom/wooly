import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'

export function Icon({ icon, size = 16 }: { icon: IconSvgElement; size?: number }) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color="currentColor"
      strokeWidth={1.5}
      style={{ display: 'block', flexShrink: 0 }}
    />
  )
}
