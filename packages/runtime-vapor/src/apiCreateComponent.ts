import type { Data } from '@vue/shared'
import {
  type Component,
  createComponentInstance,
  currentInstance,
  setupComponent,
} from './component'

export function createComponent(comp: Component, props: Data = {}) {
  const current = currentInstance!
  const instance = createComponentInstance(comp, props)
  setupComponent(instance)

  // register sub-component with current component for lifecycle management
  current.comps.add(instance)

  return instance.block
}
