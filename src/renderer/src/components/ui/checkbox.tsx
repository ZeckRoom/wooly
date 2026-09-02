import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { cn } from '@/lib/utils'
import { Icon } from './icon'

export function Checkbox({
  checked,
  onCheckedChange,
  className,
  disabled
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
  disabled?: boolean
}) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      data-slot="checkbox"
      className={cn(
        'flex size-[18px] shrink-0 cursor-pointer items-center justify-center rounded-[5px] border border-hairline bg-void text-white outline-none focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary-edge)_45%,transparent)] data-checked:border-primary-edge data-checked:bg-primary [&_input]:cursor-pointer',
        className
      )}
    >
      <CheckboxPrimitive.Indicator>
        <Icon name="check" size={16} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
