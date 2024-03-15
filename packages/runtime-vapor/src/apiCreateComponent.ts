import {
  type Component,
  createComponentInstance,
  currentInstance,
} from './component'
import { setupComponent } from './apiRender'

export function createComponent(
  comp: Component,
  rawProps: Record<string, () => unknown> | null = {},
) {
  const current = currentInstance!
  const instance = createComponentInstance(comp, rawProps)
  setupComponent(instance)

  // register sub-component with current component for lifecycle management
  current.comps.add(instance)

  return instance.block
}
