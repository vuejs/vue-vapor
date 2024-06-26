import {
  type Component,
  createComponentInstance,
  setCurrentInstance,
} from './component'
import { setupComponent } from './apiRender'
import type { RawProps } from './componentProps'
import type { RawSlots } from './componentSlots'
import { withAttrs } from './componentAttrs'
import { getCurrentScope } from '@vue/reactivity'
import type { BlockEffectScope } from './blockEffectScope'
import {
  type Directive,
  type DirectiveHookName,
  invokeDirectiveHook,
} from './directives'
import { VaporLifecycleHooks } from './enums'
import { NOOP, invokeArrayFns } from '@vue/shared'

export function createComponent(
  comp: Component,
  rawProps: RawProps | null = null,
  slots: RawSlots | null = null,
  singleRoot: boolean = false,
  once: boolean = false,
) {
  const parentScope = getCurrentScope() as BlockEffectScope
  const instance = createComponentInstance(
    comp,
    singleRoot ? withAttrs(rawProps) : rawProps,
    slots,
    once,
  )
  setupComponent(instance, singleRoot)

  const directiveBindingsMap = (parentScope.dirs ||= new Map())
  const dir: Directive = {
    beforeMount: passDirectives(
      VaporLifecycleHooks.BEFORE_MOUNT,
      'beforeMount',
    ),
    mounted: passDirectives(
      VaporLifecycleHooks.MOUNTED,
      'mounted',
      () => (instance.isMounted = true),
      true,
    ),
    beforeUnmount: passDirectives(
      VaporLifecycleHooks.BEFORE_UNMOUNT,
      'beforeUnmount',
    ),
    unmounted: passDirectives(
      VaporLifecycleHooks.UNMOUNTED,
      'unmounted',
      () => (instance.isUnmounted = true),
      true,
    ),
  }
  directiveBindingsMap.set(instance, [
    { dir, instance, value: null, oldValue: undefined },
  ])

  return instance

  function passDirectives(
    lifecycle: VaporLifecycleHooks,
    directive: DirectiveHookName,
    cb = NOOP,
    reverse?: boolean,
  ) {
    const hooks = reverse
      ? [cb, callDirHooks, callLifecycleHooks]
      : [callLifecycleHooks, callDirHooks, cb]

    return () => invokeArrayFns(hooks)

    function callDirHooks() {
      invokeDirectiveHook(instance, directive, instance.scope)
    }
    function callLifecycleHooks() {
      // lifecycle hooks may be mounted halfway.
      const lifecycleHooks = instance[lifecycle]
      if (lifecycleHooks && lifecycleHooks.length) {
        const reset = setCurrentInstance(instance)
        instance.scope.run(() => invokeArrayFns(lifecycleHooks))
        reset()
      }
    }
  }
}
