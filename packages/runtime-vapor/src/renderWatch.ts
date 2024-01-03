import {
  type BaseWatchErrorCodes,
  type BaseWatchOptions,
  type ComputedRef,
  type DebuggerOptions,
  type Ref,
  baseWatch,
  getCurrentScope,
} from '@vue/reactivity'
import { EMPTY_OBJ, NOOP, extend, remove } from '@vue/shared'
import { currentInstance } from './component'
import { useVaporRenderingScheduler } from './scheduler'
import { handleError as handleErrorWithInstance } from './errorHandling'
import { warn } from './warning'

type WatchSource<T = any> = Ref<T> | ComputedRef<T> | (() => T)

type WatchCallback<V = any, OV = any> = (
  value: V,
  oldValue: OV,
  onCleanup: OnCleanup,
) => any

type OnCleanup = (cleanupFn: () => void) => void

export interface renderWatchOptionsBase extends DebuggerOptions {}

export interface WatchOptions<Immediate = boolean>
  extends renderWatchOptionsBase {
  immediate?: Immediate
  deep?: boolean
  once?: boolean
}

export type WatchStopHandle = () => void

export function renderEffect(
  effect: () => void,
  options?: renderWatchOptionsBase,
): WatchStopHandle {
  return doWatch(effect, null, options)
}

// implementation
export function renderWatch<
  T = any,
  Immediate extends Readonly<boolean> = false,
>(
  source: T | WatchSource<T>,
  cb: any,
  options?: WatchOptions<Immediate>,
): WatchStopHandle {
  return doWatch(source as any, cb, options)
}

function doWatch(
  source: WatchSource | WatchSource[] | (() => void) | object,
  cb: WatchCallback | null,
  options: WatchOptions = EMPTY_OBJ,
): WatchStopHandle {
  const extendOptions: BaseWatchOptions = {}

  if (__DEV__) extendOptions.onWarn = warn

  // TODO: SSR
  // if (__SSR__) {}

  const instance =
    getCurrentScope() === currentInstance?.scope ? currentInstance : null

  extendOptions.onError = (err: unknown, type: BaseWatchErrorCodes) =>
    handleErrorWithInstance(err, instance, type)

  const scheduler = useVaporRenderingScheduler({ instance })
  extendOptions.scheduler = scheduler

  let effect = baseWatch(source, cb, extend({}, options, extendOptions))

  const unwatch = !effect
    ? NOOP
    : () => {
        effect!.stop()
        if (instance && instance.scope) {
          remove(instance.scope.effects!, effect)
        }
      }

  return unwatch
}
