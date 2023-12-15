import { ReactiveEffect } from '@vue/reactivity'

const p = Promise.resolve()

let queued: any[] | undefined

function queue(fn: any) {
  if (!queued) {
    queued = [fn]
    p.then(flush)
  } else {
    queued.push(fn)
  }
}

function flush() {
  for (let i = 0; i < queued!.length; i++) {
    queued![i]()
  }
  queued = undefined
}

export const nextTick = (fn?: any) => (fn ? p.then(fn) : p)

const cleanupMap: WeakMap<ReactiveEffect, (() => void)[]> = new WeakMap()
let activeEffect: ReactiveEffect | undefined = undefined

export function effect(fn: any) {
  let run: () => void

  const cleanup = () => {
    const cleanups = cleanupMap.get(e)
    if (cleanups) {
      cleanups.forEach((cleanup) => cleanup())
      cleanupMap.delete(e)
    }
  }

  const e = new ReactiveEffect(
    () => {
      cleanup()
      activeEffect = e
      try {
        fn()
      } finally {
        activeEffect = undefined
      }
    },
    () => queue(run),
  )

  e.onStop = cleanup
  run = e.run.bind(e)
  run()
}

export function onCleanup(cleanupFn: () => void) {
  if (activeEffect) {
    const cleanups =
      cleanupMap.get(activeEffect) ||
      cleanupMap.set(activeEffect, []).get(activeEffect)!
    cleanups.push(cleanupFn)
  }
}
