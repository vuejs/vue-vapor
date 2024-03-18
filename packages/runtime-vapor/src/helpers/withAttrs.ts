import type { Data } from '@vue/shared'
import { currentInstance } from '../component'
import type { RawProps } from '../componentProps'
import { type WithAttrsNode, withAttrsKey } from '../apiRender'

export function withAttrs(props: RawProps) {
  const instance = currentInstance!
  if (!props) return transformAttrs(instance.attrs)
  if (Array.isArray(props)) {
    return [transformAttrs(instance.attrs), ...props]
  }
  return [transformAttrs(instance.attrs), props]
}

export function markWithAttrs(node: WithAttrsNode) {
  node[withAttrsKey] = true
}

function transformAttrs(attrs: Data) {
  return Object.keys(attrs).reduce((acc, key) => {
    acc[key] = () => attrs[key]
    return acc
  }, {} as Data)
}
