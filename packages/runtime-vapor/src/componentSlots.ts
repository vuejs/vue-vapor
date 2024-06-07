import { type IfAny, isArray, isFunction } from '@vue/shared'
import {
  type EffectScope,
  effectScope,
  isReactive,
  shallowReactive,
} from '@vue/reactivity'
import {
  type ComponentInternalInstance,
  currentInstance,
  setCurrentInstance,
} from './component'
import { type Block, type Fragment, fragmentKey } from './apiRender'
import { firstEffect, renderEffect } from './renderEffect'
import { createComment, createTextNode, insert, remove } from './dom/element'
import { VaporErrorCodes, callWithAsyncErrorHandling } from './errorHandling'
import type { NormalizedRawProps } from './componentProps'
import type { Data } from '@vue/runtime-shared'
import { mergeProps } from './dom/prop'

// TODO: SSR

export type Slot<T extends any = any> = (
  ...args: IfAny<T, any[], [T] | (T extends undefined ? [] : never)>
) => Block

export type InternalSlots = {
  [name: string]: Slot | undefined
}

export type Slots = Readonly<InternalSlots>

export interface DynamicSlot {
  name: string
  fn: Slot
}

type DynamicSlotFn = () => DynamicSlot | DynamicSlot[]

export type DynamicSlots = DynamicSlotFn[]

export function initSlots(
  instance: ComponentInternalInstance,
  rawSlots: InternalSlots | null = null,
  dynamicSlots: DynamicSlots | null = null,
) {
  let slots: InternalSlots = {}

  for (const key in rawSlots) {
    const slot = rawSlots[key]
    if (slot) {
      slots[key] = withCtx(slot)
    }
  }

  if (dynamicSlots) {
    slots = shallowReactive(slots)
    const dynamicSlotRecords: Record<string, boolean>[] = []
    dynamicSlots.forEach((fn, index) => {
      firstEffect(instance, () => {
        const slotRecord = (dynamicSlotRecords[index] =
          dynamicSlotRecords[index] || {})
        const dynamicSlot: DynamicSlot | DynamicSlot[] =
          callWithAsyncErrorHandling(
            fn,
            instance,
            VaporErrorCodes.RENDER_FUNCTION,
          )
        // array of dynamic slot generated by <template v-for="..." #[...]>
        if (isArray(dynamicSlot)) {
          for (let j = 0; j < dynamicSlot.length; j++) {
            slots[dynamicSlot[j].name] = withCtx(dynamicSlot[j].fn)
            slotRecord[dynamicSlot[j].name] = true
          }
        } else if (dynamicSlot) {
          // conditional single slot generated by <template v-if="..." #foo>
          slots[dynamicSlot.name] = withCtx(dynamicSlot.fn)
          slotRecord[dynamicSlot.name] = true
        }
        // delete stale slots
        for (const key in slotRecord) {
          if (
            slotRecord[key] &&
            !(dynamicSlot && isArray(dynamicSlot)
              ? dynamicSlot.some(s => s.name === key)
              : dynamicSlot.name === key)
          ) {
            slotRecord[key] = false
            delete slots[key]
          }
        }
      })
    })
  }

  instance.slots = slots

  function withCtx(fn: Slot): Slot {
    return (...args: any[]) => {
      const reset = setCurrentInstance(instance.parent!)
      try {
        return fn(...args)
      } finally {
        reset()
      }
    }
  }
}

export function createSlot(
  name: string | (() => string),
  binds?: NormalizedRawProps,
  fallback?: () => Block,
): Block {
  let block: Block | undefined
  let branch: Slot | undefined
  let oldBranch: Slot | undefined
  let parent: ParentNode | undefined | null
  let scope: EffectScope | undefined
  const isDynamicName = isFunction(name)
  const instance = currentInstance!
  const { slots } = instance

  // When not using dynamic slots, simplify the process to improve performance
  if (!isDynamicName && !isReactive(slots)) {
    if ((branch = withProps(slots[name]) || fallback)) {
      return branch(binds)
    } else {
      return []
    }
  }

  const getSlot = isDynamicName ? () => slots[name()] : () => slots[name]
  const anchor = __DEV__ ? createComment('slot') : createTextNode()
  const fragment: Fragment = {
    nodes: [],
    anchor,
    [fragmentKey]: true,
  }

  // TODO lifecycle hooks
  renderEffect(() => {
    if ((branch = withProps(getSlot()) || fallback) !== oldBranch) {
      parent ||= anchor.parentNode
      if (block) {
        scope!.stop()
        remove(block, parent!)
      }
      if ((oldBranch = branch)) {
        scope = effectScope()
        fragment.nodes = block = scope.run(() => branch!(binds))!
        parent && insert(block, parent, anchor)
      } else {
        scope = block = undefined
        fragment.nodes = []
      }
    }
  })

  return fragment

  function withProps<T extends (p: any) => any>(fn?: T) {
    if (fn)
      return (binds?: NormalizedRawProps): ReturnType<T> =>
        fn(binds && normalizeSlotProps(binds))
  }
}

function normalizeSlotProps(rawPropsList: NormalizedRawProps) {
  const { length } = rawPropsList
  const mergings = length > 1 ? shallowReactive<Data[]>([]) : undefined
  const result = shallowReactive<Data>({})

  for (let i = 0; i < length; i++) {
    const rawProps = rawPropsList[i]
    if (isFunction(rawProps)) {
      // dynamic props
      renderEffect(() => {
        const props = rawProps()
        if (mergings) {
          mergings[i] = props
        } else {
          setDynamicProps(props)
        }
      })
    } else {
      // static props
      const props = mergings
        ? (mergings[i] = shallowReactive<Data>({}))
        : result
      for (const key in rawProps) {
        const valueSource = rawProps[key]
        renderEffect(() => {
          props[key] = valueSource()
        })
      }
    }
  }

  if (mergings) {
    renderEffect(() => {
      setDynamicProps(mergeProps(...mergings))
    })
  }

  return result

  function setDynamicProps(props: Data) {
    const otherExistingKeys = new Set(Object.keys(result))
    for (const key in props) {
      result[key] = props[key]
      otherExistingKeys.delete(key)
    }
    // delete other stale props
    for (const key of otherExistingKeys) {
      delete result[key]
    }
  }
}
