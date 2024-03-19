import { proxyRefs } from '@vue/reactivity'
import { type Data, isArray, isFunction, isObject } from '@vue/shared'
import { type Block, fragmentKey } from './apiRender'
import {
  type ComponentInternalInstance,
  componentKey,
  setCurrentInstance,
} from './component'
import { fallThroughAttrs } from './componentAttrs'
import type { EmitFn } from './componentEmits'
import type { EmitsOptions } from 'vue'

export type SetupContext<E = EmitsOptions> = E extends any
  ? {
      attrs: Data
      emit: EmitFn<E>
      expose: (exposed?: Record<string, any>) => void
      // TODO slots
    }
  : never

export function setupComponent(
  instance: ComponentInternalInstance,
  singleRoot: boolean = false,
): void {
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
        fragmentKey in stateOrNode ||
        componentKey in stateOrNode)
    ) {
      block = stateOrNode
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
    instance.block = block
    if (singleRoot) fallThroughAttrs(instance)
    return block
  })
  reset()
}

function createSetupContext(instance: ComponentInternalInstance): SetupContext {
  return {
    attrs: instance.attrs,
    expose: () => {},
    emit: instance.emit,
  }
}
