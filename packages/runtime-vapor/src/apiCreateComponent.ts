import {
  type Component,
  createComponentInstance,
  currentInstance,
} from './component'
import { setupComponent } from './apiRender'
import type { RawProps } from './componentProps'
import type { Slots } from './componentSlots'

export function createComponent(
  comp: Component,
  rawProps: RawProps = null,
  slots: Slots | null = null,
) {
  const current = currentInstance!
  const instance = createComponentInstance(comp, rawProps, slots)
  setupComponent(instance)

  // register sub-component with current component for lifecycle management
  current.comps.add(instance)

  return instance.block
}
