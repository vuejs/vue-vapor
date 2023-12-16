import { ReactiveEffect } from '@vue/reactivity'
import { ComponentInternalInstance } from './component'
import { SchedulerJobs } from '@vue/runtime-core'

export type QueueEffect = (
  cb: SchedulerJobs,
  suspense: ComponentInternalInstance | null,
) => void

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

export function effect(fn: any) {
  let run: () => void
  const e = new ReactiveEffect(fn, () => queue(run))
  run = e.run.bind(e)
  run()
}

export function queueJob(cb: SchedulerJobs) {
  // TODO: implement suspense
  throw new Error('Function not implemented.')
}

export function queuePostRenderEffect(
  cb: SchedulerJobs,
  suspense: ComponentInternalInstance | null,
) {
  // TODO: implement suspense
  throw new Error('Function not implemented.')
}
