import {
  ElementTypes,
  ErrorCodes,
  createCompilerError,
} from '@vue/compiler-dom'
import type { DirectiveTransform } from '../transform'
import { IRNodeTypes, type KeyOverride, type SetEventIRNode } from '../ir'
import { resolveModifiers } from '@vue/compiler-dom'
import { camelize, extend } from '@vue/shared'

// Define the directive transformation function for v-on
export const transformVOn: DirectiveTransform = (dir, node, context) => {
  let { arg, exp, loc, modifiers } = dir

  // If no expression provided and no modifiers present, throw an error
  if (!exp && !modifiers.length) {
    context.options.onError(
      createCompilerError(ErrorCodes.X_V_ON_NO_EXPRESSION, loc),
    )
  }

  // If no argument, return (TODO: support v-on="{}")
  if (!arg) {
    // TODO support v-on="{}"
    return
  }

  //If argument is static and not a custom event, camel-case it
  if (arg.isStatic) {
    if (node.tagType !== ElementTypes.ELEMENT || !/[A-Z]/.test(arg.content)) {
      arg.content = camelize(arg.content)
    }
  }

  // Resolve modifiers
  const { keyModifiers, nonKeyModifiers, eventOptionModifiers } =
    resolveModifiers(
      arg.isStatic ? `on${arg.content}` : arg,
      modifiers,
      null,
      loc,
    )

  let keyOverride: KeyOverride | undefined
  const isStaticClick = arg.isStatic && arg.content.toLowerCase() === 'click'

  // normalize click.right and click.middle since they don't actually fire
  if (nonKeyModifiers.includes('middle')) {
    if (keyOverride) {
      // TODO error here
    }
    if (isStaticClick) {
      arg = extend({}, arg, { content: 'mouseup' })
    } else if (!arg.isStatic) {
      keyOverride = ['click', 'mouseup']
    }
  }
  if (nonKeyModifiers.includes('right')) {
    if (isStaticClick) {
      arg = extend({}, arg, { content: 'contextmenu' })
    } else if (!arg.isStatic) {
      keyOverride = ['click', 'contextmenu']
    }
  }

  // Create the operation node
  const operation: SetEventIRNode = {
    type: IRNodeTypes.SET_EVENT,
    element: context.reference(),
    key: arg,
    value: exp,
    modifiers: {
      keys: keyModifiers,
      nonKeys: nonKeyModifiers,
      options: eventOptionModifiers,
    },
    keyOverride,
  }

  // Register the operation or effect based on argument's staticness
  if (arg.isStatic) {
    context.registerOperation(operation)
  } else {
    context.registerEffect([arg], [operation])
  }
}
