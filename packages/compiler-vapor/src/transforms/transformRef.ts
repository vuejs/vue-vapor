import {
  type ElementNode,
  NodeTypes,
  type SimpleExpressionNode,
  createSimpleExpression,
} from '@vue/compiler-dom'
import type { NodeTransform } from '../transform'
import { IRNodeTypes } from '../ir'
import { normalizeBindShorthand } from './vBind'
import { findProp } from '../utils'
import { EMPTY_EXPRESSION } from './utils'

export const transformRef: NodeTransform = (node, context) => {
  // If the current node has conditional directives,
  // it will result in duplicate registration of SET_REF operations.
  if (node.type !== NodeTypes.ELEMENT || hasConditionalDirective(node)) return

  const dir = findProp(node, 'ref', false, true)
  if (!dir) return

  let value: SimpleExpressionNode
  if (dir.type === NodeTypes.DIRECTIVE) {
    value = dir.exp || normalizeBindShorthand(dir.arg!, context)
  } else {
    value = dir.value
      ? createSimpleExpression(dir.value.content, true, dir.value.loc)
      : EMPTY_EXPRESSION
  }
  return () =>
    context.registerOperation({
      type: IRNodeTypes.SET_REF,
      element: context.reference(),
      value,
    })
}

function hasConditionalDirective(node: ElementNode) {
  return node.props.some(
    prop =>
      prop.type === NodeTypes.DIRECTIVE &&
      ['if', 'else-if', 'else'].includes(prop.name),
  )
}
