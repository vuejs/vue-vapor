// NOTE: this filed is based on `runtime-core/src/helpers/createSlots.ts`

import { EMPTY_ARR, isArray } from '@vue/shared'
import { renderWatch } from './renderWatch'
import type { InternalSlots, Slot } from './componentSlots'

// TODO: SSR

interface CompiledSlotDescriptor {
  name: string
  fn: Slot
  key?: string
}

export const createSlots = (
  slots: InternalSlots,
  dynamicSlotsGetter?: () => (
    | CompiledSlotDescriptor
    | CompiledSlotDescriptor[]
    | undefined
  )[],
): InternalSlots => {
  const dynamicSlotKeys: Record<string, true> = {}
  renderWatch(
    () => dynamicSlotsGetter?.() ?? EMPTY_ARR,
    dynamicSlots => {
      for (let i = 0; i < dynamicSlots.length; i++) {
        const slot = dynamicSlots[i]
        // array of dynamic slot generated by <template v-for="..." #[...]>
        if (isArray(slot)) {
          for (let j = 0; j < slot.length; j++) {
            slots[slot[j].name] = slot[j].fn
            dynamicSlotKeys[slot[j].name] = true
          }
        } else if (slot) {
          // conditional single slot generated by <template v-if="..." #foo>
          slots[slot.name] = slot.key
            ? (...args: any[]) => {
                const res = slot.fn(...args)
                // attach branch key so each conditional branch is considered a
                // different fragment
                if (res) (res as any).key = slot.key
                return res
              }
            : slot.fn
          dynamicSlotKeys[slot.name] = true
        }
      }

      // delete stale slots
      for (const key in dynamicSlotKeys) {
        if (
          // TODO: type (renderWatch)
          !dynamicSlots.some((slot: any) =>
            isArray(slot) ? slot.some(s => s.name === key) : slot?.name === key,
          )
        ) {
          delete slots[key]
        }
      }
    },
    { immediate: true },
  )
  return slots
}