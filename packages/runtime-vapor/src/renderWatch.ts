import {
  BaseWatchErrorCodes,
  type BaseWatchOptions,
  baseWatch,
  getCurrentScope,
} from '@vue/reactivity'
import { NOOP, invokeArrayFns, remove } from '@vue/shared'
import { currentInstance } from './component'
import {
  createVaporRenderingScheduler,
  queuePostRenderEffect,
} from './scheduler'
import {
  callWithAsyncErrorHandling,
  handleError as handleErrorWithInstance,
} from './errorHandling'
import { warn } from './warning'
import { invokeDirectiveHook } from './directive'

type WatchStopHandle = () => void

export function renderEffect(effect: () => void): WatchStopHandle {
  return doWatch(effect)
}

export function renderWatch(
  source: any,
  cb: (value: any, oldValue: any) => void,
): WatchStopHandle {
  return doWatch(source as any, cb)
}

function doWatch(source: any, cb?: any): WatchStopHandle {
  const extendOptions: BaseWatchOptions = {}

  if (__DEV__) extendOptions.onWarn = warn

  // TODO: Life Cycle Hooks
  // - [] Base Implementation
  // - [] Determine the trigger time of onCleanup
  // - [] Unit Test

  // trigger time:
  // now: lastTimeCleanup -> beforeUpdate -> renderEffect -> updated
  // future: beforeUpdate -> lastTimeCleanup -< renderEffect -> updated
  // The most effective way to determine that is to find a test case that can persuade the adoption of a certain scheme.
  // It should be guaranteed that there is no update operation on dom beforeUpdate, but the cleanup generally includes the operation on dom.

  // TODO: SSR
  // if (__SSR__) {}

  if (cb) {
    // watch
    cb = wrapEffectCallback(cb)
  } else {
    // effect
    source = wrapEffectCallback(source)
  }

  const instance =
    getCurrentScope() === currentInstance?.scope ? currentInstance : null

  extendOptions.onError = (err: unknown, type: BaseWatchErrorCodes) => {
    // callback error handling is in wrapEffectCallback
    if (type === BaseWatchErrorCodes.WATCH_CALLBACK) {
      throw err
    }
    handleErrorWithInstance(err, instance, type)
  }
  extendOptions.scheduler = createVaporRenderingScheduler(instance)

  let effect = baseWatch(source, cb, extendOptions)

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

function wrapEffectCallback(callback: (...args: any[]) => any): Function {
  const instance = currentInstance

  return (...args: any[]) => {
    // with lifecycle
    if (instance && instance.isMounted) {
      const { bu, u, dirs } = instance
      // currentInstance.updating = true
      // beforeUpdate hook
      const isFirstEffect = !instance.isUpdating
      if (isFirstEffect) {
        if (bu) {
          invokeArrayFns(bu)
        }
        if (dirs) {
          invokeDirectiveHook(instance, 'beforeUpdate')
        }
        instance.isUpdating = true
      }

      // run callback
      callWithAsyncErrorHandling(
        callback,
        instance,
        BaseWatchErrorCodes.WATCH_CALLBACK,
        args,
      )

      if (isFirstEffect) {
        queuePostRenderEffect(() => {
          instance.isUpdating = false
          if (dirs) {
            invokeDirectiveHook(instance, 'updated')
          }
          // updated hook
          if (u) {
            queuePostRenderEffect(u)
          }
        })
      }
    } else {
      // is not mounted
      callWithAsyncErrorHandling(
        callback,
        instance,
        BaseWatchErrorCodes.WATCH_CALLBACK,
        args,
      )
    }
  }
}
