import {
  createCompilerError,
  DirectiveNode,
  ElementNode,
  ErrorCodes,
  ExpressionNode,
  NodeTypes,
} from '@vue/compiler-core'
import type { TransformContext } from '../transform'
import { IRNodeTypes } from '../ir'
import { resolveModifiers } from '@vue/compiler-dom'
export function transformVOn(
  node: DirectiveNode,
  expr: string | null,
  context: TransformContext<ElementNode>,
) {
  const { exp, loc, modifiers } = node
  if (!exp && !modifiers.length) {
    context.options.onError!(
      createCompilerError(ErrorCodes.X_V_ON_NO_EXPRESSION, loc),
    )
    return
  }

  if (!node.arg) {
    // TODO support v-on="{}"
    return
  } else if (node.arg.type === NodeTypes.COMPOUND_EXPRESSION) {
    // TODO support @[foo]="bar"
    return
  } else if (expr === null) {
    // TODO: support @foo
    // https://github.com/vuejs/core/pull/9451
    return
  }

  // TODO context typo temporarily use any context as any,
  const { keyModifiers, nonKeyModifiers, eventOptionModifiers } =
    resolveModifiers(exp as ExpressionNode, modifiers, context as any, loc)

  context.registerEffect(expr, {
    type: IRNodeTypes.SET_EVENT,
    loc: node.loc,
    element: context.reference(),
    name: node.arg.content,
    value: expr,
    modifiers: {
      keys: keyModifiers,
      nonKeys: nonKeyModifiers,
      eventOptions: eventOptionModifiers,
    },
  })
}
