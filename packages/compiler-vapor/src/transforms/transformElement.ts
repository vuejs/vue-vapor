import {
  type AttributeNode,
  type ElementNode,
  ElementTypes,
  ErrorCodes,
  NodeTypes,
  type SimpleExpressionNode,
  createCompilerError,
} from '@vue/compiler-dom'
import { isBuiltInDirective, isReservedProp, isVoidTag } from '@vue/shared'
import type {
  DirectiveTransformResult,
  NodeTransform,
  TransformContext,
} from '../transform'
import {
  IRNodeTypes,
  type PropsExpression,
  type VaporDirectiveNode,
} from '../ir'

export const transformElement: NodeTransform = (node, context) => {
  return function postTransformElement() {
    node = context.node

    if (
      !(
        node.type === NodeTypes.ELEMENT &&
        (node.tagType === ElementTypes.ELEMENT ||
          node.tagType === ElementTypes.COMPONENT)
      )
    ) {
      return
    }

    const { tag, props } = node
    const isComponent = node.tagType === ElementTypes.COMPONENT

    context.template += `<${tag}`
    if (props.length) {
      buildProps(
        node,
        context as TransformContext<ElementNode>,
        undefined,
        isComponent,
      )
    }
    context.template += `>` + context.childrenTemplate.join('')

    // TODO remove unnecessary close tag, e.g. if it's the last element of the template
    if (!isVoidTag(tag)) {
      context.template += `</${tag}>`
    }
  }
}

function buildProps(
  node: ElementNode,
  context: TransformContext<ElementNode>,
  props: ElementNode['props'] = node.props,
  isComponent: boolean,
) {
  const expressions: SimpleExpressionNode[] = []
  const mergeArgs: PropsExpression[] = []
  let transformResults: DirectiveTransformResult[] = []

  function pushExpressions(...exprs: SimpleExpressionNode[]) {
    for (const expr of exprs) {
      if (!expr.isStatic) expressions.push(expr)
    }
  }
  function pushMergeArg() {
    if (transformResults.length) {
      // TODO dedupe
      mergeArgs.push(transformResults)
      transformResults = []
    }
  }

  for (const prop of props as (VaporDirectiveNode | AttributeNode)[]) {
    if (
      prop.type === NodeTypes.DIRECTIVE &&
      prop.name === 'bind' &&
      !prop.arg
    ) {
      if (prop.exp) {
        pushExpressions(prop.exp)
        pushMergeArg()
        mergeArgs.push(prop.exp)
      } else {
        context.options.onError(
          createCompilerError(ErrorCodes.X_V_BIND_NO_EXPRESSION, prop.loc),
        )
      }
      continue
    }

    const result = transformProp(prop, node, context)
    if (result) {
      pushExpressions(result.key, result.value)
      transformResults.push(result)
    }
  }

  // has dynamic key or v-bind="{}"
  if (mergeArgs.length) {
    pushMergeArg()
    context.registerEffect(expressions, [
      {
        type: IRNodeTypes.SET_DYNAMIC_PROPS,
        element: context.reference(),
        props: mergeArgs,
      },
    ])
  } else if (transformResults.length) {
    const hasDynamicKey = transformResults.some(({ key }) => !key.isStatic)
    // has dynamic key
    if (hasDynamicKey) {
      context.registerEffect(expressions, [
        {
          type: IRNodeTypes.SET_DYNAMIC_PROPS,
          element: context.reference(),
          props: [transformResults],
        },
      ])
    } else {
      // TODO handle class/style prop
      context.registerEffect(expressions, [
        {
          type: IRNodeTypes.SET_PROPS,
          element: context.reference(),
          props: transformResults,
        },
      ])
    }
  }
}

function transformProp(
  prop: VaporDirectiveNode | AttributeNode,
  node: ElementNode,
  context: TransformContext<ElementNode>,
): DirectiveTransformResult | void {
  const { name } = prop
  if (isReservedProp(name)) return

  if (prop.type === NodeTypes.ATTRIBUTE) {
    context.template += ` ${name}`
    if (prop.value) context.template += `="${prop.value.content}"`
    return
  }

  const directiveTransform = context.options.directiveTransforms[name]
  if (directiveTransform) {
    return directiveTransform(prop, node, context)
  } else if (!isBuiltInDirective(name)) {
    context.registerOperation({
      type: IRNodeTypes.WITH_DIRECTIVE,
      element: context.reference(),
      dir: prop,
    })
  }
}
