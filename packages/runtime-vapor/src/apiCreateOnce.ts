import { type Block, type Fragment, fragmentKey } from './apiRender'
import { effectScope } from '@vue/reactivity'
import { createComment, createTextNode } from './dom/element'
import { type ComponentInternalInstance, isVaporComponent } from './component'
import { isArray } from '@vue/shared'
import type { BlockFn } from './apiCreateIf'

/*! #__NO_SIDE_EFFECTS__ */
export const createOnce = (blockFn: BlockFn): Fragment => {
  let scope = effectScope()
  const anchor = __DEV__ ? createComment('once') : createTextNode()
  const fragment: Fragment = {
    nodes: scope.run(() => {
      const block = blockFn()
      const components = getComponents(block)
      components.forEach(comp => comp.scope.stop())
      return block
    })!,
    anchor,
    [fragmentKey]: true,
  }
  scope.stop()
  return fragment
}

function getComponents(block: Block | null) {
  let components: ComponentInternalInstance[] = []
  if (isVaporComponent(block)) {
    components.push(block, ...getComponents(block.block))
  } else if (isArray(block)) {
    block.forEach(child => components.push(...getComponents(child)))
  }
  return components
}
