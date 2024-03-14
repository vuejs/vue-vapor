import type { Data } from '@vue/shared'
import type { Component } from './component'
import { render } from './render'

export function createComponent(
  comp: Component,
  props: Data = {},
  container: string | ParentNode,
) {
  const instance = render(comp, props, container)
  return instance.block
}
