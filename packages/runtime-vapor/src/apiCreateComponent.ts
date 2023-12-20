import { Data } from '@vue/shared'
import { Component } from './component'
import { render } from './render'

export function createComponent(comp: Component, props: Data = {}) {
  const instance = render(comp, props)
  return instance.block
}
