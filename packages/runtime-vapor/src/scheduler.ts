import { ReactiveEffect } from '@vue/reactivity'

const p = Promise.resolve()

type Queued = { value?: any[] }
let preQueued: Queued = {}
let renderQueued: Queued = {}
let postQueued: Queued = {}

function queue(fn: any, queued: Queued) {
  if (!queued.value) {
    queued.value = [fn]
    p.then(flush)
  } else {
    queued.value.push(fn)
  }
}

function flush() {
  flushAQueued(preQueued)
  flushAQueued(renderQueued)
  flushAQueued(postQueued)
}

function flushAQueued(queued: Queued) {
  if (queued.value) {
    for (let i = 0; i < queued.value.length; i++) {
      queued.value[i]()
    }
  }
  queued.value = undefined
}

export const nextTick = (fn?: any) => (fn ? p.then(fn) : p)

export type EffectOptions = {
  flush?: 'pre' | 'post' | 'render'
}

export function effect(fn: any, options?: EffectOptions) {
  let run: () => void

  const flushMode = options?.flush
  const queued =
    flushMode === 'pre'
      ? preQueued
      : flushMode === 'post'
        ? postQueued
        : renderQueued // default

  const e = new ReactiveEffect(fn, () => queue(run, queued))
  run = e.run.bind(e)
  run()
}
