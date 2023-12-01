import {
  createCompilerError,
  DirectiveNode,
  ElementNode,
  ErrorCodes,
  ExpressionNode, isStaticExp,
  NodeTypes,
} from '@vue/compiler-core'
import type { TransformContext } from '../transform'
import { IRNodeTypes } from '../ir'
import { resolveModifiers } from '@vue/compiler-dom'
import {makeMap} from "@vue/shared";

export const isKeyboardEvent = /*#__PURE__*/ makeMap(
    `keyup,keydown,keypress`,
    true
)

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
  let name = node.arg.content


  if (nonKeyModifiers.includes('right')) {
    name = 'contextmenu'
  }
  if (nonKeyModifiers.includes('middle')) {
    name = 'mouseup'
  }
  let callHelpers = []
  if (nonKeyModifiers.length) {
    callHelpers.push('withModifiers')
  }

  if (
      keyModifiers.length &&
      // TODO: <h1 @keyup.enter.right ="dec">{{count}}</h1>
      //  vapor has not been statically optimized yet,
      //  so the behavior here is different from vue/core
      (!isStaticExp(node.arg) || isKeyboardEvent(name))
  ) {
    callHelpers.push('withKeys')
  }

  context.registerEffect(expr, {
    type: IRNodeTypes.SET_EVENT,
    loc: node.loc,
    element: context.reference(),
    name,
    value: expr,
    modifiers: {
      keys: keyModifiers,
      nonKeys: nonKeyModifiers,
      eventOptions: eventOptionModifiers,
      callHelpers,
    },
  })
}
