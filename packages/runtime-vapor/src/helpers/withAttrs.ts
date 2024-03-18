import { currentInstance } from '../component'
import type { RawProps } from '../componentProps'

export function withAttrs(props: RawProps): RawProps {
  const instance = currentInstance!
  if (instance.component.inheritAttrs === false) return props
  if (!props) return [() => instance.attrs]
  if (Array.isArray(props)) {
    return [() => instance.attrs, ...props]
  }
  return [() => instance.attrs, props]
}
