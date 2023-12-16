import {
  DebuggerOptions,
  EffectScheduler,
  ErrorCodes,
  ReactiveEffect,
  WatchCallback,
  WatchEffect,
  WatchOptionsBase,
  WatchSource,
  WatchStopHandle,
  callWithAsyncErrorHandling,
  callWithErrorHandling,
  getCurrentScope,
  isReactive,
  isRef,
  traverse,
  warn,
} from '@vue/runtime-core'
import {
  EMPTY_OBJ,
  NOOP,
  extend,
  isArray,
  isFunction,
  remove,
} from '@vue/shared'
import { currentInstance } from './component'
import { SchedulerJob } from 'packages/runtime-core/src/scheduler'
import {
  type Scheduler,
  getVaporSchedulerByFlushMode,
  vaporPostScheduler,
  vaporSyncScheduler,
} from './scheduler'

type OnCleanup = (cleanupFn: () => void) => void

export interface doWatchOptions<Immediate = boolean> extends DebuggerOptions {
  immediate?: Immediate
  deep?: boolean
  once?: boolean
}

// Simple effect.
export function watchEffect(
  effect: WatchEffect,
  options: WatchOptionsBase = EMPTY_OBJ,
): WatchStopHandle {
  const { flush } = options
  return doWatch(effect, null, getVaporSchedulerByFlushMode(flush), options)
}

export function watchPostEffect(
  effect: WatchEffect,
  options?: DebuggerOptions,
) {
  return doWatch(
    effect,
    null,
    vaporPostScheduler,
    __DEV__ ? extend({}, options as any, { flush: 'post' }) : { flush: 'post' },
  )
}

export function watchSyncEffect(
  effect: WatchEffect,
  options?: DebuggerOptions,
) {
  return doWatch(
    effect,
    null,
    vaporSyncScheduler,
    __DEV__ ? extend({}, options as any, { flush: 'sync' }) : { flush: 'sync' },
  )
}

export function doWatch(
  source: WatchSource | WatchSource[] | WatchEffect | object,
  cb: WatchCallback | null,
  scheduler: Scheduler,
  { immediate, deep, once, onTrack, onTrigger }: doWatchOptions = EMPTY_OBJ,
): WatchStopHandle {
  if (cb && once) {
    const _cb = cb
    cb = (...args) => {
      _cb(...args)
      unwatch()
    }
  }

  if (__DEV__ && !cb) {
    if (immediate !== undefined) {
      warn(
        `watch() "immediate" option is only respected when using the ` +
          `watch(source, callback, options?) signature.`,
      )
    }
    if (deep !== undefined) {
      warn(
        `watch() "deep" option is only respected when using the ` +
          `watch(source, callback, options?) signature.`,
      )
    }
    if (once !== undefined) {
      warn(
        `watch() "once" option is only respected when using the ` +
          `watch(source, callback, options?) signature.`,
      )
    }
  }

  const warnInvalidSource = (s: unknown) => {
    warn(
      `Invalid watch source: `,
      s,
      `A watch source can only be a getter/effect function, a ref, ` +
        `a reactive object, or an array of these types.`,
    )
  }

  const instance =
    getCurrentScope() === currentInstance?.scope ? currentInstance : null
  // const instance = currentInstance
  let getter: () => any

  if (isRef(source)) {
    getter = () => source.value
  } else if (isReactive(source)) {
    getter = () => source
    deep = true
  } else if (isArray(source)) {
    getter = () =>
      source.map((s) => {
        if (isRef(s)) {
          return s.value
        } else if (isReactive(s)) {
          return traverse(s)
        } else if (isFunction(s)) {
          return callWithErrorHandling(s, instance, ErrorCodes.WATCH_GETTER)
        } else {
          __DEV__ && warnInvalidSource(s)
        }
      })
  } else if (isFunction(source)) {
    if (cb) {
      // getter with cb
      getter = () =>
        callWithErrorHandling(source, instance, ErrorCodes.WATCH_GETTER)
    } else {
      // no cb -> simple effect
      getter = () => {
        if (instance && instance.isUnmounted) {
          return
        }
        if (cleanup) {
          cleanup()
        }
        return callWithAsyncErrorHandling(
          source,
          instance,
          ErrorCodes.WATCH_CALLBACK,
          [onCleanup],
        )
      }
    }
  } else {
    getter = NOOP
    __DEV__ && warnInvalidSource(source)
  }

  if (cb && deep) {
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }

  let cleanup: (() => void) | undefined
  let onCleanup: OnCleanup = (fn: () => void) => {
    cleanup = effect.onStop = () => {
      callWithErrorHandling(fn, instance, ErrorCodes.WATCH_CLEANUP)
      cleanup = effect.onStop = undefined
    }
  }

  // TODO: ssr
  // if (__SSR__ && isInSSRComponentSetup) {
  // }

  const job: SchedulerJob = () => {
    if (!effect.active || !effect.dirty) {
      return
    }
    if (cb) {
      // TODO: watch(source, cb)
    } else {
      // watchEffect
      effect.run()
    }
  }

  // important: mark the job as a watcher callback so that scheduler knows
  // it is allowed to self-trigger (#1727)
  job.allowRecurse = !!cb

  let effectScheduler: EffectScheduler = () =>
    scheduler({
      effect,
      job,
      instance: instance,
      isInit: false,
    })

  const effect = new ReactiveEffect(getter, NOOP, effectScheduler)

  const unwatch = () => {
    effect.stop()
    if (instance && instance.scope) {
      remove(instance.scope.effects!, effect)
    }
  }

  if (__DEV__) {
    effect.onTrack = onTrack
    effect.onTrigger = onTrigger
  }

  // initial run
  scheduler({
    effect,
    job,
    instance: instance,
    isInit: true,
  })

  // TODO: ssr
  // if (__SSR__ && ssrCleanup) ssrCleanup.push(unwatch)
  return unwatch
}
