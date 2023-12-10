import { pauseTracking, resetTracking } from '@vue/reactivity'
import {
  type ComponentInternalInstance,
  currentInstance,
  setCurrentInstance,
} from './component'

export enum VaporLifecycleHooks {
  BEFORE_CREATE = 'bc',
  CREATED = 'c',
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
  DEACTIVATED = 'da',
  ACTIVATED = 'a',
  RENDER_TRIGGERED = 'rtg',
  RENDER_TRACKED = 'rtc',
  ERROR_CAPTURED = 'ec',
  SERVER_PREFETCH = 'sp',
}

export const injectHook = (
  type: VaporLifecycleHooks,
  hook: Function & { __weh?: Function },
  target: ComponentInternalInstance | null = currentInstance,
  prepend: boolean = false,
) => {
  if (target) {
    const hooks = target[type] || (target[type] = [])
    const wrappedHook =
      hook.__weh ||
      (hook.__weh = (...args: unknown[]) => {
        if (target.isUnmounted) {
          return
        }
        pauseTracking()
        setCurrentInstance(target)
        // TODO: call error handling
        const res = hook(...args)
        resetTracking()
        return res
      })
    if (prepend) {
      hooks.unshift(wrappedHook)
    } else {
      hooks.push(wrappedHook)
    }
    return wrappedHook
  } else if (__DEV__) {
    // TODO: warn need
  }
}
export const createHook =
  <T extends Function = () => any>(lifecycle: VaporLifecycleHooks) =>
  (hook: T, target: ComponentInternalInstance | null = currentInstance) =>
    injectHook(lifecycle, (...args: unknown[]) => hook(...args), target)

export const onMounted = createHook(VaporLifecycleHooks.MOUNTED)
export const onBeforeMount = createHook(VaporLifecycleHooks.BEFORE_MOUNT)
export const onBeforeUpdate = createHook(VaporLifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(VaporLifecycleHooks.UPDATED)
export const onBeforeUnmount = createHook(VaporLifecycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createHook(VaporLifecycleHooks.UNMOUNTED)
