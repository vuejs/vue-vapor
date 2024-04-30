import { type ElementNode, NodeTypes, findDir } from '@vue/compiler-dom'
import {
  type TransformContext,
  createStructuralDirectiveTransform,
} from '../transform'
import { type BlockIRNode, DynamicFlag, IRNodeTypes } from '../ir'
import { newBlock, wrapTemplate } from './utils'

export const transformOnce = createStructuralDirectiveTransform(
  ['once'],
  (node, _, context) => {
    if (
      node.type === NodeTypes.ELEMENT &&
      findDir(node, 'once', true) &&
      !context.inVOnce
    ) {
      context.inVOnce = true

      const id = context.reference()
      context.dynamic.flags |= DynamicFlag.INSERT
      const [block, onExit] = createNewBlock(node, context)

      return () => {
        onExit()
        context.registerOperation({
          type: IRNodeTypes.ONCE,
          id,
          block,
        })
      }
    }
  },
)

function createNewBlock(
  node: ElementNode,
  context: TransformContext<ElementNode>,
): [BlockIRNode, () => void] {
  context.node = node = wrapTemplate(node, ['once'])
  const block: BlockIRNode = newBlock(node)
  const exitBlock = context.enterBlock(block)
  context.reference()
  return [block, exitBlock]
}
