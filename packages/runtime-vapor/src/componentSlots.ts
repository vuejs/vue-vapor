import type { IfAny } from '@vue/shared'
import type { ComponentInternalInstance } from './component'
import type { Block } from './apiRender'

export type Slot<T extends any = any> = (
  ...args: IfAny<T, any[], [T] | (T extends undefined ? [] : never)>
) => Block[]

export type InternalSlots = {
  [name: string]: Slot | undefined
}

export type Slots = Readonly<InternalSlots>

export const initSlots = (
  instance: ComponentInternalInstance,
  slots: Slots | null,
) => {
  if (!slots) slots = {}
  // TODO: normalize?
  instance.slots = slots
}

// TODO: $stable ?
