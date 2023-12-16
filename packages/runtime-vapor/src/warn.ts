import { pauseTracking, resetTracking } from '@vue/reactivity'

export const warn = (msg: string, ...args: any[]) => {
  if (!__DEV__) {
    return
  }
  pauseTracking()
  // TODO: component trace need.
  console.warn(msg)
  resetTracking()
}
