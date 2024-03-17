import { proxyRefs } from '@vue/reactivity'
import { type Data, isArray, isFunction, isObject } from '@vue/shared'
import { type ComponentInternalInstance, setCurrentInstance } from './component'
import { getAttrsProxy } from './componentAttrs'
import { type Block, fragmentKey } from './apiRender'
import type { EmitFn, EmitsOptions } from './componentEmits'

export type SetupContext<E = EmitsOptions> = E extends any
  ? {
      attrs: Data
      emit: EmitFn<E>
      expose: (exposed?: Record<string, any>) => void
    }
  : never

export function setupComponent(instance: ComponentInternalInstance): void {
  const reset = setCurrentInstance(instance)
  instance.scope.run(() => {
    const { component, props } = instance
    const ctx = createSetupContext(instance)

    const setupFn = isFunction(component) ? component : component.setup
    const stateOrNode = setupFn && setupFn(props, ctx)

    let block: Block | undefined

    if (
      stateOrNode &&
      (stateOrNode instanceof Node ||
        isArray(stateOrNode) ||
        (stateOrNode as any)[fragmentKey])
    ) {
      block = stateOrNode as Block
    } else if (isObject(stateOrNode)) {
      instance.setupState = proxyRefs(stateOrNode)
    }
    if (!block && component.render) {
      block = component.render(instance.setupState)
    }

    if (block instanceof DocumentFragment) {
      block = Array.from(block.childNodes)
    }
    if (!block) {
      // TODO: warn no template
      block = []
    }
    return (instance.block = block)
  })
  reset()
}

export function createSetupContext(
  instance: ComponentInternalInstance,
): SetupContext {
  if (__DEV__) {
    // We use getters in dev in case libs like test-utils overwrite instance
    // properties (overwrites should not be done in prod)
    return Object.freeze({
      expose: () => {},
      get attrs() {
        return getAttrsProxy(instance)
      },
      get emit() {
        return (event: string, ...args: any[]) => instance.emit(event, ...args)
      },
    })
  } else {
    return {
      expose: () => {},
      get attrs() {
        return getAttrsProxy(instance)
      },
      emit: instance.emit,
    }
  }
}
