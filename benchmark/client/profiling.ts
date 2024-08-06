/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-restricted-globals */

declare module globalThis {
  let doProfile: boolean
  let times: Record<string, number[]>
}

globalThis.doProfile = false
export const defer = () => new Promise(r => requestIdleCallback(r))

const times: Record<string, number[]> = (globalThis.times = {})

export function wrap(
  id: string,
  fn: (...args: any[]) => any,
): (...args: any[]) => Promise<void> {
  return async (...args) => {
    const btns = Array.from(
      document.querySelectorAll<HTMLButtonElement>('#control button'),
    )
    const timeEl = document.getElementById('time')!
    timeEl.classList.remove('done')
    for (const node of btns) {
      node.disabled = true
    }

    const { doProfile } = globalThis
    await defer()

    doProfile && console.profile(id)
    const start = performance.now()
    fn(...args)
    await defer()
    const time = performance.now() - start
    const prevTimes = times[id] || (times[id] = [])
    prevTimes.push(time)
    const median = prevTimes.slice().sort((a, b) => a - b)[
      Math.floor(prevTimes.length / 2)
    ]
    const mean = prevTimes.reduce((a, b) => a + b, 0) / prevTimes.length

    const msg =
      `${id}: min: ${Math.min(...prevTimes).toFixed(2)} / ` +
      `max: ${Math.max(...prevTimes).toFixed(2)} / ` +
      `median: ${median.toFixed(2)}ms / ` +
      `mean: ${mean.toFixed(2)}ms / ` +
      `time: ${time.toFixed(2)}ms / ` +
      `std: ${getStandardDeviation(prevTimes).toFixed(2)} ` +
      `over ${prevTimes.length} runs`
    doProfile && console.profileEnd(id)
    console.log(msg)
    timeEl.textContent = msg
    timeEl.classList.add('done')

    for (const node of btns) {
      node.disabled = false
    }
  }
}

function getStandardDeviation(array: number[]) {
  const n = array.length
  const mean = array.reduce((a, b) => a + b) / n
  return Math.sqrt(
    array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n,
  )
}
