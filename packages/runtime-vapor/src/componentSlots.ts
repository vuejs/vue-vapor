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
export type DynamicSlot = { name: string; fn: Slot }
export type DynamicSlotFn = () => DynamicSlot | DynamicSlot[] | undefined
export type NormalizedRawSlots = Array<StaticSlots | DynamicSlotFn>
export type RawSlots = NormalizedRawSlots | StaticSlots | null

export const isDynamicSlotFn = isFunction as (
  val: StaticSlots | DynamicSlotFn,
) => val is DynamicSlotFn

export function initSlots(
  instance: ComponentInternalInstance,
  rawSlots: RawSlots | null = null,
): void {
  if (!rawSlots) return
  if (!isArray(rawSlots)) rawSlots = [rawSlots]

  if (!rawSlots.some(slot => isDynamicSlotFn(slot))) {
    instance.slots = {}
    // with ctx
    const slots = rawSlots[0] as StaticSlots
    for (const name in slots) {
      resolveSlot(name, slots[name])
    }
    return
  }

  instance.slots = shallowReactive({})
  const renderedSlotKeys: Set<string>[] = []
  const slotsQueue: Record<string, [number, Slot][]> = {}
  rawSlots.forEach((slots, index) => {
    const isDynamicSlot = isDynamicSlotFn(slots)
    if (isDynamicSlot) {
      firstEffect(instance, () => {
        const renderedKeys =
          renderedSlotKeys[index] || (renderedSlotKeys[index] = new Set())
        let dynamicSlot: ReturnType<DynamicSlotFn>
        dynamicSlot = slots()
        const restoreSlotNames = cleanupSlot(index)
        if (isArray(dynamicSlot)) {
          for (const slot of dynamicSlot) {
            registerSlot(slot.name, slot.fn, index, renderedKeys)
          }
        } else if (dynamicSlot) {
          registerSlot(dynamicSlot.name, dynamicSlot.fn, index, renderedKeys)
        }
        if (restoreSlotNames.length) {
          for (const key of restoreSlotNames) {
            const [restoreLevel, restoreFn] = slotsQueue[key][0]
            renderedSlotKeys[restoreLevel] &&
              renderedSlotKeys[restoreLevel].add(key)
            resolveSlot(key, restoreFn)
          }
        }
        for (const name of renderedKeys) {
          if (
            !(isArray(dynamicSlot)
              ? dynamicSlot.some(s => s.name === name)
              : dynamicSlot && dynamicSlot.name === name)
          ) {
            renderedKeys.delete(name)
            delete instance.slots[name]
          }
        }
      })
    } else {
      for (const name in slots) {
        registerSlot(name, slots[name], index)
      }
    }
  })

  function cleanupSlot(level: number) {
    const restoreSlotNames: string[] = []
    Object.keys(slotsQueue).forEach(slotName => {
      const index = slotsQueue[slotName].findIndex(([l]) => l === level)
      if (index > -1) {
        slotsQueue[slotName].splice(index, 1)
        if (!slotsQueue[slotName].length) {
          delete slotsQueue[slotName]
          return
        }
        if (index === 0) {
          renderedSlotKeys[level] && renderedSlotKeys[level].delete(slotName)
          restoreSlotNames.push(slotName)
        }
      }
    })
    return restoreSlotNames
  }

  function registerSlot(
    name: string,
    fn: Slot,
    level: number,
    renderedKeys?: Set<string>,
  ) {
    slotsQueue[name] = slotsQueue[name] || []
    slotsQueue[name].push([level, fn])
    slotsQueue[name].sort((a, b) => b[0] - a[0])
    if (slotsQueue[name][1]) {
      const hidenLevel = slotsQueue[name][1][0]
      renderedSlotKeys[hidenLevel] && renderedSlotKeys[hidenLevel].delete(name)
    }
    if (slotsQueue[name][0][0] === level) {
      renderedKeys && renderedKeys.add(name)
    }
    resolveSlot(name, slotsQueue[name][0][1])
  }

  function resolveSlot(name: string, fn: Slot) {
    instance.slots[name] = withCtx(fn)
  }

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
