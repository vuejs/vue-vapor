import { type IfAny, isArray, isFunction } from '@vue/shared'
import {
  type EffectScope,
  effectScope,
  isReactive,
  shallowReactive,
  shallowRef,
} from '@vue/reactivity'
import {
  type ComponentInternalInstance,
  currentInstance,
  setCurrentInstance,
} from './component'
import { type Block, type Fragment, fragmentKey, isValidBlock } from './block'
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
      addSlot(name, slots[name])
    }
    return
  }

  instance.slots = shallowReactive({})
  const renderedSlotKeys: Set<string>[] = []
  /**
   * Maintain a queue for each slot name, so that we can
   * render the next slot when the highest level slot was removed
   */
  const slotsQueue: Record<string, [level: number, slot: Slot][]> = {}
  rawSlots.forEach((slots, index) => {
    const isDynamicSlot = isDynamicSlotFn(slots)
    if (isDynamicSlot) {
      firstEffect(instance, () => {
        const renderedKeys = (renderedSlotKeys[index] ||= new Set())
        let dynamicSlot = slots()
        // cleanup slots and re-calc to avoid diffing slots between renders
        // cleanup will return a slotNames array contains the slot names that need to be restored
        const restoreSlotNames = cleanupSlot(index)
        if (isArray(dynamicSlot)) {
          for (const slot of dynamicSlot) {
            registerSlot(slot.name, slot.fn, index, renderedKeys)
          }
        } else if (dynamicSlot) {
          registerSlot(dynamicSlot.name, dynamicSlot.fn, index, renderedKeys)
        }
        // restore after re-calc slots
        if (restoreSlotNames.length) {
          for (const key of restoreSlotNames) {
            const [restoreLevel, restoreFn] = slotsQueue[key][0]
            renderedSlotKeys[restoreLevel] &&
              renderedSlotKeys[restoreLevel].add(key)
            addSlot(key, restoreFn)
          }
        }
        // delete stale slots
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
    // remove slots from all queues
    Object.keys(slotsQueue).forEach(slotName => {
      const index = slotsQueue[slotName].findIndex(([l]) => l === level)
      if (index > -1) {
        slotsQueue[slotName] = slotsQueue[slotName].filter(([l]) => l !== level)
        if (!slotsQueue[slotName].length) {
          delete slotsQueue[slotName]
          return
        }
        // restore next slot if the removed slots was the highest level slot
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
    slot: Slot,
    level: number,
    renderedKeys?: Set<string>,
  ) {
    slotsQueue[name] ||= []
    slotsQueue[name].push([level, slot])
    slotsQueue[name].sort((a, b) => b[0] - a[0])
    // hide old slot if the registered slot is the highest level
    if (slotsQueue[name][1]) {
      const hidenLevel = slotsQueue[name][1][0]
      renderedSlotKeys[hidenLevel] && renderedSlotKeys[hidenLevel].delete(name)
    }
    if (slotsQueue[name][0][0] === level) {
      renderedKeys && renderedKeys.add(name)
    }
    // render the highest level slot
    addSlot(name, slotsQueue[name][0][1])
  }

  function addSlot(name: string, fn: Slot) {
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
  fallback?: Slot,
): Block {
  const { slots } = currentInstance!

  const slotBlock = shallowRef<Block>()
  let slotBranch: Slot | undefined
  let slotScope: EffectScope | undefined

  let fallbackBlock: Block | undefined
  let fallbackBranch: Slot | undefined
  let fallbackScope: EffectScope | undefined

  const normalizeBinds = binds && normalizeSlotProps(binds)

  const isDynamicName = isFunction(name)
  // fast path for static slots & without fallback
  if (!isDynamicName && !isReactive(slots) && !fallback) {
    if ((slotBranch = slots[name])) {
      return slotBranch(normalizeBinds)
    } else {
      return []
    }
  }

  const anchor = __DEV__ ? createComment('slot') : createTextNode()
  const fragment: Fragment = {
    nodes: [],
    anchor,
    [fragmentKey]: true,
  }

  // TODO lifecycle hooks
  renderEffect(() => {
    const parent = anchor.parentNode

    if (
      !slotBlock.value || // not initied
      fallbackScope || // in fallback slot
      isValidBlock(slotBlock.value) // slot block is valid
    ) {
      renderSlot(parent)
    } else {
      renderFallback(parent)
    }
  })

  return fragment

  function renderSlot(parent: ParentNode | null) {
    // from fallback to slot
    const fromFallback = fallbackScope
    if (fromFallback) {
      // clean fallback slot
      fallbackScope!.stop()
      remove(fallbackBlock!, parent!)
      fallbackScope = fallbackBlock = undefined
    }

    const slotName = isFunction(name) ? name() : name
    const branch = slots[slotName]!

    if (branch) {
      // init slot scope and block or switch branch
      if (!slotScope || slotBranch !== branch) {
        // clean previous slot
        if (slotScope && !fromFallback) {
          slotScope.stop()
          remove(slotBlock.value!, parent!)
        }

        slotBranch = branch
        slotScope = effectScope()
        slotBlock.value = slotScope.run(() => slotBranch!(normalizeBinds))
      }

      // if slot block is valid, render it
      if (slotBlock.value && isValidBlock(slotBlock.value)) {
        fragment.nodes = slotBlock.value
        parent && insert(slotBlock.value, parent, anchor)
      } else {
        renderFallback(parent)
      }
    } else {
      renderFallback(parent)
    }
  }

  function renderFallback(parent: ParentNode | null) {
    // if slot branch is initied, remove it from DOM, but keep the scope
    if (slotBranch) {
      remove(slotBlock.value!, parent!)
    }

    fallbackBranch ||= fallback
    if (fallbackBranch) {
      fallbackScope = effectScope()
      fragment.nodes = fallbackBlock = fallbackScope.run(() =>
        fallbackBranch!(normalizeBinds),
      )!
      parent && insert(fallbackBlock, parent, anchor)
    } else {
      fragment.nodes = []
    }
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
