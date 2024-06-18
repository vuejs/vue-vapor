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
import type { NormalizedRawProps } from './componentProps'
import type { Data } from '@vue/runtime-shared'
import { mergeProps } from './dom/prop'

// TODO: SSR

export type Slot<T extends any = any> = (
  ...args: IfAny<T, any[], [T] | (T extends undefined ? [] : never)>
) => Block

export type StaticSlots = Record<string, Slot>
export type DynamicSlot = () => { name: string; fn: Slot } | undefined
export type NormalizedRawSlots = Array<StaticSlots | DynamicSlot>
export type RawSlots = NormalizedRawSlots | StaticSlots | null

export function initSlots(
  instance: ComponentInternalInstance,
  rawSlots: RawSlots | null = null,
) {
  if (!rawSlots) return
  if (!isArray(rawSlots)) rawSlots = [rawSlots]

  if (rawSlots.length === 1 && !isFunction(rawSlots[0])) {
    instance.slots = rawSlots[0]
    return
  }

  const resolved: StaticSlots = (instance.slots = shallowReactive({}))
  firstEffect(instance, () => {
    const keys = new Set<string>()
    for (const slots of rawSlots) {
      if (isFunction(slots)) {
        const dynamicSlot = slots()
        dynamicSlot && registerSlot(dynamicSlot.name, dynamicSlot.fn)
      } else {
        for (const name in slots) {
          registerSlot(name, slots[name])
        }
      }
    }

    for (const key in resolved) {
      if (!keys.has(key)) {
        delete resolved[key]
      }
    }

    function registerSlot(name: string, fn: Slot) {
      resolved[name] = withCtx(fn)
      keys.add(name)
    }
  })

  function withCtx(fn: Slot): Slot {
    return (...args: any[]) => {
      const reset = setCurrentInstance(instance.parent!)
      try {
        return fn(...(args as any))
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
