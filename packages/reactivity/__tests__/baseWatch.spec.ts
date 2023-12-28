import {
  type Scheduler,
  type SchedulerJob,
  baseWatch,
  onEffectCleanup,
} from '../src/baseWatch'
import { EffectScope } from '../src/effectScope'
import { type Ref, ref } from '../src/ref'

const queue: SchedulerJob[] = []

let isFlushPending = false
const resolvedPromise = /*#__PURE__*/ Promise.resolve() as Promise<any>
const nextTick = (fn?: () => any) =>
  fn ? resolvedPromise.then(fn) : resolvedPromise
const scheduler: Scheduler = ({ job }) => {
  queue.push(job)
  flushJobs()
}
const flushJobs = () => {
  if (isFlushPending) return
  isFlushPending = true
  resolvedPromise.then(() => {
    queue.forEach(job => job())
    queue.length = 0
    isFlushPending = false
  })
}

describe('baseWatch with onEffectCleanup', () => {
  test('basic', async () => {
    let dummy = 0
    let source: Ref<number>
    const scope = new EffectScope()

    scope.run(() => {
      source = ref(0)
      baseWatch(onCleanup => {
        source.value

        onCleanup(() => (dummy += 2))
        onEffectCleanup(() => (dummy += 3))
        onEffectCleanup(() => (dummy += 5))
      })
    })
    expect(dummy).toBe(0)

    scope.run(() => {
      source.value++
    })
    expect(dummy).toBe(10)

    scope.run(() => {
      source.value++
    })
    expect(dummy).toBe(20)

    scope.stop()
    expect(dummy).toBe(30)
  })

  test('nested call to baseWatch', async () => {
    let calls: string[] = []
    let source: Ref<number>
    let copyist: Ref<number>
    const scope = new EffectScope()

    scope.run(() => {
      source = ref(0)
      copyist = ref(0)
      // sync by default
      baseWatch(
        () => {
          const current = (copyist.value = source.value)
          onEffectCleanup(() => calls.push(`sync ${current}`))
        },
        null,
        {},
      )
      // with scheduler
      baseWatch(
        () => {
          const current = copyist.value
          onEffectCleanup(() => calls.push(`post ${current}`))
        },
        null,
        { scheduler },
      )
    })

    await nextTick()
    expect(calls).toEqual([])

    scope.run(() => source.value++)
    expect(calls).toEqual(['sync 0'])
    await nextTick()
    expect(calls).toEqual(['sync 0', 'post 0'])
    calls.length = 0

    scope.run(() => source.value++)
    expect(calls).toEqual(['sync 1'])
    await nextTick()
    expect(calls).toEqual(['sync 1', 'post 1'])
    calls.length = 0

    scope.stop()
    expect(calls).toEqual(['sync 2', 'post 2'])
  })
})
