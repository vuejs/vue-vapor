import { onCleanup } from './scheduler'

export function on(
  el: HTMLElement,
  event: string,
  handler: () => any,
  options?: AddEventListenerOptions,
) {
  el.addEventListener(event, handler, options)
  onCleanup(() => el.removeEventListener(event, handler, options))
}
