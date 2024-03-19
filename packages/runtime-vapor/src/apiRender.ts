import type { ComponentInternalInstance } from './component'
import { insert, querySelector, remove } from './dom/element'
import { flushPostFlushCbs, queuePostRenderEffect } from './scheduler'
import { invokeLifecycle } from './componentLifecycle'
import { VaporLifecycleHooks } from './apiLifecycle'

export const fragmentKey = Symbol(__DEV__ ? `fragmentKey` : ``)

export type Block = Node | Fragment | ComponentInternalInstance | Block[]
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

  // hook: beforeMount
  invokeLifecycle(instance, VaporLifecycleHooks.BEFORE_MOUNT, 'beforeMount')

  insert(instance.block!, instance.container)
  instance.isMounted = true

  // hook: mounted
  invokeLifecycle(instance, VaporLifecycleHooks.MOUNTED, 'mounted', true)

  return instance
}

export function unmountComponent(instance: ComponentInternalInstance) {
  const { container, block, scope } = instance

  // hook: beforeUnmount
  invokeLifecycle(instance, VaporLifecycleHooks.BEFORE_UNMOUNT, 'beforeUnmount')

  scope.stop()
  block && remove(block, container)

  // hook: unmounted
  invokeLifecycle(instance, VaporLifecycleHooks.UNMOUNTED, 'unmounted', true)
  queuePostRenderEffect(() => (instance.isUnmounted = true))
}
