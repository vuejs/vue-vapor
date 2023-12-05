import { NodeTransform } from '../transform'
import { findDir, NodeTypes } from '@vue/compiler-core'

const seen = new WeakSet()
export const transformMemo: NodeTransform = (node, context) => {
  if (node.type === NodeTypes.ELEMENT) {
    const dir = findDir(node, 'memo')
    if (!dir || seen.has(node)) {
      return
    }
    const { exp } = dir
    if (!exp) {
      return
    } else if (exp.type === NodeTypes.COMPOUND_EXPRESSION) {
      // TODO
      return
    }

    if (!context.inVMemo) {
      context.inVMemo = {
        exp: [exp],
        parentMemoNum: 0,
      }
    } else {
      const parentMemo = context.inVMemo.exp
      context.inVMemo.exp = parentMemo.concat([exp])
      context.inVMemo.parentMemoNum += parentMemo.length
    }
  }
}
