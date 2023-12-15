import { ReactiveEffect } from '@vue/reactivity'
import { clean } from 'semver'

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

const cleanupMap: WeakMap<any, (() => void)[]> = new WeakMap()
let activeEffect: any = undefined

export function effect(fn: any) {
  let run: () => void

  const cleanup = () => {
    const cleanups = cleanupMap.get(fn)
    if (cleanups) {
      cleanups.forEach((cleanup) => cleanup())
      cleanupMap.delete(fn)
    }
  }

  const e = new ReactiveEffect(
    () => {
      cleanup()
      activeEffect = fn
      try {
        activeEffect()
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

export function onCleanup(fn: any) {
  if (activeEffect) {
    const cleanups =
      cleanupMap.get(activeEffect) ||
      cleanupMap.set(activeEffect, []).get(activeEffect)!
    cleanups.push(fn)
  }
}
