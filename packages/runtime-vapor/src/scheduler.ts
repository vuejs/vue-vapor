import { ReactiveEffect } from '@vue/reactivity'

const p = Promise.resolve()

let preQueued: any[] | undefined
let renderQueued: any[] | undefined
let postQueued: any[] | undefined

function queue(fn: any, queued: any[] | undefined) {
  if (!queued) {
    queued = [fn]
    p.then(flush)
  } else {
    queued.push(fn)
  }
}

function flush() {
  flushAQueued(preQueued)
  flushAQueued(renderQueued)
  flushAQueued(postQueued)
}

function flushAQueued(queued: any[] | undefined) {
  if (queued) {
    for (let i = 0; i < queued.length; i++) {
      queued[i]()
    }
    queued = undefined
  }
}

export const nextTick = (fn?: any) => (fn ? p.then(fn) : p)

export function effect(fn: any, options: any) {
  let run: () => void

  const queued =
    options.flush === 'pre'
      ? preQueued
      : options.flush === 'post'
        ? postQueued
        : renderQueued

  const e = new ReactiveEffect(fn, () => queue(run, queued))
  run = e.run.bind(e)
  run()
}
