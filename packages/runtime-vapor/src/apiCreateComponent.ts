import {
  type Component,
  createComponentInstance,
  currentInstance,
} from './component'
import { setupComponent } from './apiRender'
import type { NormalizedRawProps } from './componentProps'
import { withAttrs } from './componentAttrs'

export function createComponent(
  comp: Component,
  rawProps: NormalizedRawProps | null = null,
  singleRoot: boolean = false,
) {
  const current = currentInstance!
  const instance = createComponentInstance(
    comp,
    singleRoot ? withAttrs(rawProps) : rawProps,
  )
  setupComponent(instance, singleRoot)

  // register sub-component with current component for lifecycle management
  current.comps.add(instance)

  return instance
}
