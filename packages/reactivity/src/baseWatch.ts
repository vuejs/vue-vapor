import {
  EMPTY_OBJ,
  isObject,
  isArray,
  isFunction,
  hasChanged,
  NOOP,
  isMap,
  isSet,
  isPlainObject,
  isPromise
} from '@vue/shared'
import { warn } from './warning'
import { ComputedRef } from './computed'
import { ReactiveFlags } from './constants'
import { DebuggerOptions, ReactiveEffect, EffectScheduler } from './effect'
import { isShallow, isReactive } from './reactive'
import { Ref, isRef } from './ref'

// contexts where user provided function may be executed, in addition to
// lifecycle hooks.
export enum BaseWatchErrorCodes {
  WATCH_GETTER = 'BaseWatchErrorCodes_WATCH_GETTER',
  WATCH_CALLBACK = 'BaseWatchErrorCodes_WATCH_CALLBACK',
  WATCH_CLEANUP = 'BaseWatchErrorCodes_WATCH_CLEANUP'
}

// TODO move to a scheduler package
export interface SchedulerJob extends Function {
  id?: number
  pre?: boolean
  active?: boolean
  computed?: boolean
  /**
   * Indicates whether the effect is allowed to recursively trigger itself
   * when managed by the scheduler.
   *
   * By default, a job cannot trigger itself because some built-in method calls,
   * e.g. Array.prototype.push actually performs reads as well (#1740) which
   * can lead to confusing infinite loops.
   * The allowed cases are component update functions and watch callbacks.
   * Component update functions may update child component props, which in turn
   * trigger flush: "pre" watch callbacks that mutates state that the parent
   * relies on (#1801). Watch callbacks doesn't track its dependencies so if it
   * triggers itself again, it's likely intentional and it is the user's
   * responsibility to perform recursive state mutation that eventually
   * stabilizes (#1727).
   */
  allowRecurse?: boolean
}

export type WatchEffect = (onCleanup: OnCleanup) => void

export type WatchSource<T = any> = Ref<T> | ComputedRef<T> | (() => T)

export type WatchCallback<V = any, OV = any> = (
  value: V,
  oldValue: OV,
  onCleanup: OnCleanup
) => any

type OnCleanup = (cleanupFn: () => void) => void

export interface BaseWatchOptions<Immediate = boolean> extends DebuggerOptions {
  immediate?: Immediate
  deep?: boolean
  once?: boolean
  scheduler?: Scheduler
  handleError?: HandleError
  handleWarn?: HandleWarn
}

export type WatchStopHandle = () => void

export interface WatchInstance extends WatchStopHandle {
  effect?: ReactiveEffect
}

// initial value for watchers to trigger on undefined initial values
const INITIAL_WATCHER_VALUE = {}

export type Scheduler = (context: {
  effect: ReactiveEffect
  job: SchedulerJob
  isInit: boolean
}) => void

const DEFAULT_SCHEDULER: Scheduler = ({ job }) => job()

export type HandleError = (err: unknown, type: BaseWatchErrorCodes) => void

const DEFAULT_HANDLE_ERROR: HandleError = (err: unknown) => {
  throw err
}

export type HandleWarn = (msg: string, ...args: any[]) => void

const cleanupMap: WeakMap<ReactiveEffect, (() => void)[]> = new WeakMap()
let activeEffect: ReactiveEffect | undefined = undefined

export function onEffectCleanup(cleanupFn: () => void) {
  if (activeEffect) {
    const cleanups =
      cleanupMap.get(activeEffect) ||
      cleanupMap.set(activeEffect, []).get(activeEffect)!
    cleanups.push(cleanupFn)
  }
}

export function baseWatch(
  source: WatchSource | WatchSource[] | WatchEffect | object,
  cb: WatchCallback | null,
  {
    immediate,
    deep,
    once,
    onTrack,
    onTrigger,
    scheduler = DEFAULT_SCHEDULER,
    handleError: handleError = DEFAULT_HANDLE_ERROR,
    handleWarn: handleWarn = warn
  }: BaseWatchOptions = EMPTY_OBJ
): WatchInstance {
  const warnInvalidSource = (s: unknown) => {
    handleWarn(
      `Invalid watch source: `,
      s,
      `A watch source can only be a getter/effect function, a ref, ` +
        `a reactive object, or an array of these types.`
    )
  }

  let getter: () => any
  let forceTrigger = false
  let isMultiSource = false

  if (isRef(source)) {
    getter = () => source.value
    forceTrigger = isShallow(source)
  } else if (isReactive(source)) {
    getter = () => source
    deep = true
  } else if (isArray(source)) {
    isMultiSource = true
    forceTrigger = source.some(s => isReactive(s) || isShallow(s))
    getter = () =>
      source.map(s => {
        if (isRef(s)) {
          return s.value
        } else if (isReactive(s)) {
          return traverse(s)
        } else if (isFunction(s)) {
          return callWithErrorHandling(
            s,
            handleError,
            BaseWatchErrorCodes.WATCH_GETTER
          )
        } else {
          __DEV__ && warnInvalidSource(s)
        }
      })
  } else if (isFunction(source)) {
    if (cb) {
      // getter with cb
      getter = () =>
        callWithErrorHandling(
          source,
          handleError,
          BaseWatchErrorCodes.WATCH_GETTER
        )
    } else {
      // no cb -> simple effect
      getter = () => {
        if (cleanup) {
          cleanup()
        }
        const currentEffect = activeEffect
        activeEffect = effect
        try {
          return callWithAsyncErrorHandling(
            source,
            handleError,
            BaseWatchErrorCodes.WATCH_CALLBACK,
            [onEffectCleanup]
          )
        } finally {
          activeEffect = currentEffect
        }
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

  if (once) {
    if (!cb) {
      getter()
      return NOOP
    }
    if (immediate) {
      callWithAsyncErrorHandling(
        cb,
        handleError,
        BaseWatchErrorCodes.WATCH_CALLBACK,
        [getter(), isMultiSource ? [] : undefined, onEffectCleanup]
      )
      return NOOP
    }
    const _cb = cb
    cb = (...args) => {
      _cb(...args)
      unwatch()
    }
  }

  let oldValue: any = isMultiSource
    ? new Array((source as []).length).fill(INITIAL_WATCHER_VALUE)
    : INITIAL_WATCHER_VALUE
  const job: SchedulerJob = () => {
    if (!effect.active || !effect.dirty) {
      return
    }
    if (cb) {
      // watch(source, cb)
      const newValue = effect.run()
      if (
        deep ||
        forceTrigger ||
        (isMultiSource
          ? (newValue as any[]).some((v, i) => hasChanged(v, oldValue[i]))
          : hasChanged(newValue, oldValue))
      ) {
        // cleanup before running cb again
        if (cleanup) {
          cleanup()
        }
        const currentEffect = activeEffect
        activeEffect = effect
        try {
          callWithAsyncErrorHandling(
            cb,
            handleError,
            BaseWatchErrorCodes.WATCH_CALLBACK,
            [
              newValue,
              // pass undefined as the old value when it's changed for the first time
              oldValue === INITIAL_WATCHER_VALUE
                ? undefined
                : isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE
                  ? []
                  : oldValue,
              onEffectCleanup
            ]
          )
          oldValue = newValue
        } finally {
          activeEffect = currentEffect
        }
      }
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
      isInit: false
    })

  const effect = new ReactiveEffect(getter, NOOP, effectScheduler)

  const cleanup = (effect.onStop = () => {
    const cleanups = cleanupMap.get(effect)
    if (cleanups) {
      cleanups.forEach(cleanup =>
        callWithErrorHandling(
          cleanup,
          handleError,
          BaseWatchErrorCodes.WATCH_CLEANUP
        )
      )
      cleanupMap.delete(effect)
    }
  })

  const unwatch: WatchInstance = () => {
    effect.stop()
  }
  unwatch.effect = effect

  if (__DEV__) {
    effect.onTrack = onTrack
    effect.onTrigger = onTrigger
  }

  // initial run
  if (cb) {
    if (immediate) {
      job()
    } else {
      oldValue = effect.run()
    }
  } else {
    scheduler({
      effect,
      job,
      isInit: true
    })
  }

  return unwatch
}

export function traverse(value: unknown, seen?: Set<unknown>) {
  if (!isObject(value) || (value as any)[ReactiveFlags.SKIP]) {
    return value
  }
  seen = seen || new Set()
  if (seen.has(value)) {
    return value
  }
  seen.add(value)
  if (isRef(value)) {
    traverse(value.value, seen)
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen)
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v: any) => {
      traverse(v, seen)
    })
  } else if (isPlainObject(value)) {
    for (const key in value) {
      traverse(value[key], seen)
    }
  }
  return value
}

export function callWithErrorHandling(
  fn: Function,
  handleError: HandleError,
  type: BaseWatchErrorCodes,
  args?: unknown[]
) {
  let res
  try {
    res = args ? fn(...args) : fn()
  } catch (err) {
    handleError(err, type)
  }
  return res
}

export function callWithAsyncErrorHandling(
  fn: Function | Function[],
  handleError: HandleError,
  type: BaseWatchErrorCodes,
  args?: unknown[]
): any[] {
  if (isFunction(fn)) {
    const res = callWithErrorHandling(fn, handleError, type, args)
    if (res && isPromise(res)) {
      res.catch(err => {
        handleError(err, type)
      })
    }
    return res
  }

  const values = []
  for (let i = 0; i < fn.length; i++) {
    values.push(callWithAsyncErrorHandling(fn[i], handleError, type, args))
  }
  return values
}
