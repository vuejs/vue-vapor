import { ReactiveEffect } from '@vue/reactivity'
import { ComponentInternalInstance } from './component'
import { SchedulerJob, SchedulerJobs } from '@vue/runtime-core'

export type QueueEffect = (
  cb: SchedulerJobs,
  suspense: ComponentInternalInstance | null,
) => void

export type Scheduler = (context: {
  effect: ReactiveEffect
  job: SchedulerJob
  instance: ComponentInternalInstance | null
  isInit: boolean
}) => void

let isFlushing = false
let isFlushPending = false

const queue: SchedulerJob[] = []
let flushIndex = 0

const pendingPostFlushCbs: SchedulerJob[] = []
let activePostFlushCbs: SchedulerJob[] | null = null
let postFlushIndex = 0

const resolvedPromise = /*#__PURE__*/ Promise.resolve() as Promise<any>
let currentFlushPromise: Promise<void> | null = null

function queueJob(job: SchedulerJob) {
  if (
    !queue.length ||
    !queue.includes(
      job,
      isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex,
    )
  ) {
    if (job.id == null) {
      queue.push(job)
    } else {
      queue.splice(findInsertionIndex(job.id), 0, job)
    }
    queueFlush()
  }
}

export function queuePostRenderEffect(cb: SchedulerJob) {
  if (
    !activePostFlushCbs ||
    !activePostFlushCbs.includes(
      cb,
      cb.allowRecurse ? postFlushIndex + 1 : postFlushIndex,
    )
  ) {
    pendingPostFlushCbs.push(cb)
  }
  queueFlush()
}

function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}

function flushPostFlushCbs() {
  if (!pendingPostFlushCbs.length) return

  const deduped = [...new Set(pendingPostFlushCbs)]
  pendingPostFlushCbs.length = 0

  // #1947 already has active queue, nested flushPostFlushCbs call
  if (activePostFlushCbs) {
    activePostFlushCbs.push(...deduped)
    return
  }

  activePostFlushCbs = deduped

  activePostFlushCbs.sort((a, b) => getId(a) - getId(b))

  for (
    postFlushIndex = 0;
    postFlushIndex < activePostFlushCbs.length;
    postFlushIndex++
  ) {
    activePostFlushCbs[postFlushIndex]()
  }
  activePostFlushCbs = null
  postFlushIndex = 0
}

// TODO: dev mode and checkRecursiveUpdates
function flushJobs() {
  isFlushPending = false
  isFlushing = true

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child so its render effect will have smaller
  //    priority number)
  // 2. If a component is unmounted during a parent component's update,
  //    its update can be skipped.
  queue.sort(comparator)

  try {
    for (let i = 0; i < queue!.length; i++) {
      queue![i]()
    }
  } finally {
    flushIndex = 0
    queue.length = 0

    flushPostFlushCbs()

    isFlushing = false
    currentFlushPromise = null
    // some postFlushCb queued jobs!
    // keep flushing until it drains.
    if (queue.length || pendingPostFlushCbs.length) {
      flushJobs()
    }
  }
}

export function nextTick<T = void, R = void>(
  this: T,
  fn?: (this: T) => R,
): Promise<Awaited<R>> {
  const p = currentFlushPromise || resolvedPromise
  return fn ? p.then(this ? fn.bind(this) : fn) : p
}

// #2768
// Use binary-search to find a suitable position in the queue,
// so that the queue maintains the increasing order of job's id,
// which can prevent the job from being skipped and also can avoid repeated patching.
function findInsertionIndex(id: number) {
  // the start index should be `flushIndex + 1`
  let start = flushIndex + 1
  let end = queue.length

  while (start < end) {
    const middle = (start + end) >>> 1
    const middleJob = queue[middle]
    const middleJobId = getId(middleJob)
    if (middleJobId < id || (middleJobId === id && middleJob.pre)) {
      start = middle + 1
    } else {
      end = middle
    }
  }

  return start
}

const getId = (job: SchedulerJob): number =>
  job.id == null ? Infinity : job.id

const comparator = (a: SchedulerJob, b: SchedulerJob): number => {
  const diff = getId(a) - getId(b)
  if (diff === 0) {
    if (a.pre && !b.pre) return -1
    if (b.pre && !a.pre) return 1
  }
  return diff
}

// TODO: remove this
export function effect(fn: any) {
  let run: () => void
  const e = new ReactiveEffect(fn, () => queueJob(run))
  run = e.run.bind(e)
  run()
}

export function getVaporSchedulerByFlushMode(
  flush?: 'pre' | 'post' | 'sync',
): Scheduler {
  if (flush === 'post') {
    return vaporPostScheduler
  } else if (flush === 'sync') {
    return vaporSyncScheduler
  } else {
    // default: 'pre'
    return vaporPreScheduler
  }
}

export const vaporSyncScheduler: Scheduler = ({ isInit, effect, job }) => {
  if (isInit) {
    effect.run()
  } else {
    job()
  }
}

export const vaporPreScheduler: Scheduler = ({
  isInit,
  effect,
  instance,
  job,
}) => {
  if (isInit) {
    effect.run()
  } else {
    job.pre = true
    if (instance) job.id = instance.uid
    queueJob(job)
  }
}

export const vaporPostScheduler: Scheduler = ({ isInit, effect, job }) => {
  if (isInit) {
    queuePostRenderEffect(effect.run.bind(effect))
  } else {
    queuePostRenderEffect(job)
  }
}
