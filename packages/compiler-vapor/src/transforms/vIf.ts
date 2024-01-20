import type { RootNode, TemplateChildNode } from '@vue/compiler-dom'
import {
  type TransformContext,
  createStructuralDirectiveTransform,
} from '../transform'
import {
  type BlockFunctionIRNode,
  IRNodeTypes,
  type IfIRNode,
  type VaporDirectiveNode,
} from '../ir'
import { extend } from '@vue/shared'

export const transformIf = createStructuralDirectiveTransform(
  /^(if|else|else-if)$/,
  processIf,
)

export function processIf(
  node: RootNode | TemplateChildNode,
  dir: VaporDirectiveNode,
  context: TransformContext<RootNode | TemplateChildNode>,
) {
  // TODO refactor this
  const parentContext = extend({}, context, {
    currentScopeIR: context.blockFnIR,
  })

  if (dir.name === 'if') {
    const id = context.reference()
    context.dynamic.ghost = true
    const [branch, onExit] = createIfBranch(node, dir, context)
    const operation: IfIRNode = {
      type: IRNodeTypes.IF,
      id,
      loc: dir.loc,
      condition: dir.exp!,
      truthyBranch: branch,
    }
    parentContext.registerOperation(operation)
    return onExit
  }
}

export function createIfBranch(
  node: RootNode | TemplateChildNode,
  dir: VaporDirectiveNode,
  context: TransformContext<RootNode | TemplateChildNode>,
): [BlockFunctionIRNode, () => void] {
  const branch: BlockFunctionIRNode = {
    type: IRNodeTypes.BLOCK_FUNCTION,
    loc: dir.loc,
    source: (node as any)?.source || '',
    node: node,
    templateIndex: -1,
    dynamic: {
      id: null,
      referenced: false,
      ghost: false,
      placeholder: null,
      children: {},
    },
    effect: [],
    operation: [],
  }

  const reset = context.replaceBlockFnIR(branch)
  context.reference()
  context.pushTemplate()
  const onExit = () => {
    context.pushTemplate()
    reset()
  }
  return [branch, onExit]
}
