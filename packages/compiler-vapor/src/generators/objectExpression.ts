import {
  type ObjectExpression,
  type SimpleExpressionNode,
  isSimpleIdentifier,
} from '@vue/compiler-dom'
import {
  type CodeFragment,
  type CodegenContext,
  INDENT_END,
  INDENT_START,
  NEWLINE,
  buildCodeFragment,
} from '../generate'
import { genExpression } from './expression'
import type { IRExpression } from '@vue/compiler-vapor'
import { isString } from '@vue/shared'

export function genObjectExpression(
  node: ObjectExpression,
  context: CodegenContext,
): CodeFragment[] {
  const { properties } = node
  if (!properties.length) {
    return [`{}`]
  }

  const genProperties = () => {
    const [frag, push] = buildCodeFragment()
    for (let i = 0; i < properties.length; i++) {
      const { key, value } = properties[i]
      push(
        ...genExpressionAsPropertyKey(key as SimpleExpressionNode, context),
        `: `,
        ...genExpression(value as SimpleExpressionNode, context),
      )
      i < properties.length - 1 && push(`,`, NEWLINE)
    }
    return frag
  }

  return properties.length > 1
    ? [`{`, INDENT_START, ...genProperties(), INDENT_END, `}`]
    : [`{ `, ...genProperties(), ` }`]
}

function genExpressionAsPropertyKey(
  node: IRExpression,
  context: CodegenContext,
): CodeFragment[] {
  if (isString(node) || node.isStatic) {
    const keyName = isString(node) ? node : node.content
    return [isSimpleIdentifier(keyName) ? keyName : JSON.stringify(keyName)]
  } else {
    return ['[', ...genExpression(node, context), ']']
  }
}
