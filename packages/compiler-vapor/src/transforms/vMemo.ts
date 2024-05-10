import {
  type ElementNode,
  NodeTypes,
  createSimpleExpression,
  findDir,
} from '@vue/compiler-dom'
import {
  type TransformContext,
  createStructuralDirectiveTransform,
} from '../transform'
import { type BlockIRNode, DynamicFlag, IRNodeTypes } from '../ir'
import { newBlock, wrapTemplate } from './utils'

export const transformMemo = createStructuralDirectiveTransform(
  ['memo'],
  (node, dir, context) => {
    if (node.type === NodeTypes.ELEMENT && findDir(node, 'memo', true)) {
      const id = context.reference()

      context.inVMemo = 1 + (context.parent?.inVMemo || 0)
      context.dynamic.flags |= DynamicFlag.NON_TEMPLATE | DynamicFlag.INSERT

      const [block, onExit] = createNewBlock(node, context)

      return () => {
        onExit()
        context.registerOperation({
          type: IRNodeTypes.MEMO,
          id,
          render: block,
          memo: dir.exp! || createSimpleExpression('[]', false),
          level: context.inVMemo - 1,
        })
      }
    }
  },
)

function createNewBlock(
  node: ElementNode,
  context: TransformContext<ElementNode>,
): [BlockIRNode, () => void] {
  context.node = node = wrapTemplate(node, ['memo'])
  const block: BlockIRNode = newBlock(node)
  const exitBlock = context.enterBlock(block)
  context.reference()
  return [block, exitBlock]
}
