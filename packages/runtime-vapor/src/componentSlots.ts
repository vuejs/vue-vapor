import { isFunction, isObject } from '@vue/shared'
import type { Block, ChildBlock } from './render'
import type { ComponentInternalInstance } from './component'

// TODO: type?
export type Slot = (...args: any) => Block

export type InternalSlots = {
  [name: string]: Slot | undefined
}

export type Slots = Readonly<InternalSlots>

export type RawSlots = {
  [name: string]: unknown
}

const normalizeObjectSlots = (rawSlots: RawSlots, slots: InternalSlots) => {
  for (const key in rawSlots) {
    const value = rawSlots[key]
    if (isFunction(value)) {
      slots[key] = value as Slot
    } else if (value != null) {
      slots[key] = (() => value) as Slot
    }
  }
}

const normalizeVNodeSlots = (
  instance: ComponentInternalInstance,
  children: ChildBlock,
) => {
  instance.slots.default = (
    isFunction(children) ? children : () => children
  ) as Slot
}

export const initSlots = (
  instance: ComponentInternalInstance,
  children: ChildBlock,
) => {
  if (isObject(children)) {
    normalizeObjectSlots(
      children as Record<string, Block>,
      (instance.slots = {}),
    )
  } else {
    instance.slots = {}
    if (children) {
      normalizeVNodeSlots(instance, children)
    }
  }
}
