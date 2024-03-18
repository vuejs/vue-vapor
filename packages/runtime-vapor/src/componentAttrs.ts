import { camelize, isArray, isFunction } from '@vue/shared'
import type { ComponentInternalInstance } from './component'
import { isEmitListener } from './componentEmits'
import type { Block } from './apiRender'
import { setDynamicProp } from './dom/prop'

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

export function fallThroughAttrs(instance: ComponentInternalInstance) {
  const attrs = instance.attrs
  const block = getFallThroughNode(instance.block!)
  if (!block) return
  for (const key in attrs) {
    if (block instanceof Element) {
      setDynamicProp(block, key, attrs[key])
    }
  }
}

function getFallThroughNode(block: Block) {
  if (block instanceof Node) return block
  if (isArray(block) && block.length === 1) return getFallThroughNode(block[0])
  return null
}
