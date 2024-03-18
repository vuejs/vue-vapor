import { camelize, isFunction } from '@vue/shared'
import type { ComponentInternalInstance } from './component'
import { isEmitListener } from './componentEmits'
import { type Block, type WithAttrsNode, withAttrsKey } from './apiRender'
import { setDynamicProp } from './dom/prop'
import { baseWatch } from '@vue/reactivity'
import { createVaporPreScheduler } from './scheduler'

export function patchAttrs(instance: ComponentInternalInstance) {
  const attrs = instance.attrs
  const options = instance.propsOptions[0]

  const keys = new Set<string>()
  if (instance.rawProps.length)
    for (const props of Array.from(instance.rawProps).reverse()) {
      if (isFunction(props)) {
        const resolved = props()
        for (const rawKey in resolved) {
          registerAttr(rawKey, () => resolved[rawKey])
        }
      } else {
        for (const rawKey in props) {
          registerAttr(rawKey, props[rawKey])
        }
      }
    }

  for (const key in attrs) {
    if (!keys.has(key)) {
      delete attrs[key]
    }
  }

  function registerAttr(key: string, getter: () => unknown) {
    if (
      (!options || !(camelize(key) in options)) &&
      !isEmitListener(instance.emitsOptions, key)
    ) {
      keys.add(key)
      if (key in attrs) return
      Object.defineProperty(attrs, key, {
        get: getter,
        enumerable: true,
        configurable: true,
      })
    }
  }
}

export function fallThroughAttrs(
  instance: ComponentInternalInstance,
  singleRoot: boolean,
) {
  const {
    block,
    component: { inheritAttrs },
    uid,
  } = instance
  if (singleRoot && inheritAttrs !== false && !(withAttrsKey in block!)) {
    ;(block as WithAttrsNode)[withAttrsKey] = uid
  }
  if (
    inheritAttrs !== false &&
    withAttrsKey in block! &&
    block[withAttrsKey] === uid
  ) {
    baseWatch(() => doFallThroughAttrs(instance), undefined, {
      scheduler: createVaporPreScheduler(instance),
    })
  }
}

export function doFallThroughAttrs(instance: ComponentInternalInstance) {
  const attrs = instance.attrs
  const block = getFallThroughNode(instance.block!, instance.uid)
  if (!block) return
  for (const key in attrs) {
    if (block instanceof Element) {
      setDynamicProp(block, key, attrs[key])
    }
  }
}

function getFallThroughNode(block: Block, id: number) {
  if (withAttrsKey in block && block[withAttrsKey] === id) return block
  return null
}
