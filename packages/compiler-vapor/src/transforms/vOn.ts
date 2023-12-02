import {
  createCompilerError,
  DirectiveNode,
  ElementNode,
  ErrorCodes,
  ExpressionNode,
  isStaticExp,
  NodeTypes,
  SimpleExpressionNode,
} from '@vue/compiler-core'
import type { TransformContext } from '../transform'
import { IRNodeTypes } from '../ir'
import { resolveModifiers } from '@vue/compiler-dom'
import { makeMap } from '@vue/shared'

export const isKeyboardEvent = /*#__PURE__*/ makeMap(
  `keyup,keydown,keypress`,
  true,
)

export function transformVOn(
  node: DirectiveNode,
  context: TransformContext<ElementNode>,
) {
  const { arg, exp, loc, modifiers } = node
  if (!exp && !modifiers.length) {
    context.options.onError(
      createCompilerError(ErrorCodes.X_V_ON_NO_EXPRESSION, loc),
    )
    return
  }

  if (!arg) {
    // TODO support v-on="{}"
    return
  } else if (exp === undefined) {
    // TODO: support @foo
    // https://github.com/vuejs/core/pull/9451
    return
  }

  // TODO context typo temporarily use any context as any,
  const { keyModifiers, nonKeyModifiers, eventOptionModifiers } =
    resolveModifiers(exp as ExpressionNode, modifiers, context as any, loc)
  let name = (arg as SimpleExpressionNode).content
  if (nonKeyModifiers.includes('right')) {
    name = transformClick(arg, 'contextmenu')
  }
  if (nonKeyModifiers.includes('middle')) {
    name = transformClick(arg, 'mouseup')
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
    (!isStaticExp(arg) || isKeyboardEvent(name))
  ) {
    callHelpers.push('withKeys')
  }

  context.registerEffect(
    [exp],
    [
      {
        type: IRNodeTypes.SET_EVENT,
        loc: node.loc,
        element: context.reference(),
        name,
        value: exp,
        modifiers: {
          keys: keyModifiers,
          nonKeys: nonKeyModifiers,
          eventOptions: eventOptionModifiers,
          callHelpers,
        },
      },
    ],
  )
}

const transformClick = (key: ExpressionNode, event: string) => {
  const isStaticClick =
    isStaticExp(key) && key.content.toLowerCase() === 'click'

  if (isStaticClick) {
    return event
  } else if (key.type !== NodeTypes.SIMPLE_EXPRESSION) {
    // TODO: handle CompoundExpression
    return event
  } else {
    return key.content.toLowerCase()
  }
}
