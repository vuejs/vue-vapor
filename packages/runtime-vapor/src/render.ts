import { reactive } from '@vue/reactivity'
import { Data, extend } from '@vue/shared'

import {
  type Component,
  type ComponentInternalInstance,
  createComponentInstance,
  setCurrentInstance,
  unsetCurrentInstance,
} from './component'

import { initProps } from './componentProps'

import { invokeDirectiveHook } from './directives'
import { insert, remove } from './dom'

export type Block = Node | Fragment | Block[]
export type ParentBlock = ParentNode | Node[]
export type Fragment = { nodes: Block; anchor: Node }
export type BlockFn = (props: any, ctx: any) => Block

export function render(
  comp: Component,
  props: Data,
  container: string | ParentNode,
): ComponentInternalInstance {
  const instance = createComponentInstance(comp)
  initProps(instance, props)
  return mountComponent(instance, (container = normalizeContainer(container)))
}

export function normalizeContainer(container: string | ParentNode): ParentNode {
  return typeof container === 'string'
    ? (document.querySelector(container) as ParentNode)
    : container
}

// export const mountComponent = (
//   comp: Component,
//   props: any,
//   container: ParentNode,
// ): ComponentInternalInstance => {
//   const instance = createComponentInstance(comp)
//   initProps(instance, props)

//   setCurrentInstance(instance)
//   instance.container = container
//   const block = instance.scope.run(
//     () => (instance.block = instance.blockFn(instance.props)),
//   )!
//   insert(block, instance.container)
//   instance.isMounted = true
//   unsetCurrentInstance()

//   return instance
// }

export function mountComponent(
  instance: ComponentInternalInstance,
  container: ParentNode,
) {
  instance.container = container

  setCurrentInstance(instance)
  const block = instance.scope.run(() => {
    const { component, props } = instance
    const ctx = { expose: () => {} }

    const setupFn =
      typeof component === 'function' ? component : component.setup
    console.log(
      '🚀 ~ file: render.ts:70 ~ block ~ setupFn:',
      component,
      setupFn,
    )

    const state = setupFn(props, ctx)

    if (state && '__isScriptSetup' in state) {
      return (instance.block = component.render(
        reactive(
          // TODO: merge
          extend(props, state),
        ),
      ))
    } else {
      return (instance.block = state as Block)
    }
  })!
  invokeDirectiveHook(instance, 'beforeMount')
  insert(block, instance.container)
  instance.isMounted = true
  invokeDirectiveHook(instance, 'mounted')
  unsetCurrentInstance()

  // TODO: lifecycle hooks (mounted, ...)
  // const { m } = instance
  // m && invoke(m)

  return instance
}

export function unmountComponent(instance: ComponentInternalInstance) {
  const { container, block, scope } = instance

  invokeDirectiveHook(instance, 'beforeUnmount')
  scope.stop()
  block && remove(block, container)
  instance.isMounted = false
  invokeDirectiveHook(instance, 'unmounted')
  unsetCurrentInstance()

  // TODO: lifecycle hooks (unmounted, ...)
  // const { um } = instance
  // um && invoke(um)
}
