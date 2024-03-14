import { invokeArrayFns } from '@vue/shared'
import {
  type ComponentInternalInstance,
  setCurrentInstance,
  unsetCurrentInstance,
} from './component'
import { invokeDirectiveHook } from './directives'
import { insert, querySelector, remove } from './dom/element'
import { flushPostFlushCbs, queuePostRenderEffect } from './scheduler'

export const fragmentKey = Symbol(__DEV__ ? `fragmentKey` : ``)

export type Block = Node | Fragment | Block[]
export type Fragment = {
  nodes: Block
  anchor?: Node
  [fragmentKey]: true
}

export function render(
  instance: ComponentInternalInstance,
  container: string | ParentNode,
): void {
  mountComponent(instance, (container = normalizeContainer(container)))
  flushPostFlushCbs()
}

function normalizeContainer(container: string | ParentNode): ParentNode {
  return typeof container === 'string'
    ? (querySelector(container) as ParentNode)
    : container
}

function mountComponent(
  instance: ComponentInternalInstance,
  container: ParentNode,
) {
  instance.container = container
  const reset = setCurrentInstance(instance)
  const { bm, m } = instance

  // hook: beforeMount
  bm && invokeArrayFns(bm)
  invokeDirectiveHook(instance, 'beforeMount')

  insert(instance.block!, instance.container)
  instance.isMounted = true

  // hook: mounted
  queuePostRenderEffect(() => {
    invokeDirectiveHook(instance, 'mounted')
    m && invokeArrayFns(m)
  })
  reset()

  return instance
}

export function unmountComponent(instance: ComponentInternalInstance) {
  const { container, block, scope, um, bum } = instance

  // hook: beforeUnmount
  bum && invokeArrayFns(bum)
  invokeDirectiveHook(instance, 'beforeUnmount')

  scope.stop()
  block && remove(block, container)
  instance.isMounted = false
  instance.isUnmounted = true

  // hook: unmounted
  invokeDirectiveHook(instance, 'unmounted')
  um && invokeArrayFns(um)
  unsetCurrentInstance()
}
