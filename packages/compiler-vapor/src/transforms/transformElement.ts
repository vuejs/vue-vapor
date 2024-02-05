import {
  type AttributeNode,
  type ElementNode,
  ElementTypes,
  ErrorCodes,
  NodeTypes,
  type SimpleExpressionNode,
  createCompilerError,
  createSimpleExpression,
} from '@vue/compiler-dom'
import {
  isArray,
  isBuiltInDirective,
  isReservedProp,
  isVoidTag,
} from '@vue/shared'
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
  props: (VaporDirectiveNode | AttributeNode)[] = node.props as any,
  isComponent: boolean,
) {
  const dynamicArgs: PropsExpression[] = []
  const dynamicExpr: SimpleExpressionNode[] = []
  let results: DirectiveTransformResult[] = []

  function pushDynamicExpressions(
    ...exprs: (SimpleExpressionNode | SimpleExpressionNode[] | undefined)[]
  ) {
    for (const expr of exprs) {
      if (isArray(expr)) {
        pushDynamicExpressions(...expr)
      } else if (expr && !expr.isStatic) {
        dynamicExpr.push(expr)
      }
    }
  }

  function pushMergeArg() {
    if (results.length) {
      dynamicArgs.push(dedupeProperties(results))
      results = []
    }
  }

  // treat all props as dynamic key
  const asDynamic = props.some(
    prop =>
      prop.type === NodeTypes.DIRECTIVE &&
      prop.name === 'bind' &&
      (!prop.arg || !prop.arg.isStatic),
  )

  for (const prop of props) {
    if (
      prop.type === NodeTypes.DIRECTIVE &&
      prop.name === 'bind' &&
      !prop.arg
    ) {
      if (prop.exp) {
        pushDynamicExpressions(prop.exp)
        pushMergeArg()
        dynamicArgs.push(prop.exp)
      } else {
        context.options.onError(
          createCompilerError(ErrorCodes.X_V_BIND_NO_EXPRESSION, prop.loc),
        )
      }
      continue
    }

    const result = transformProp(prop, node, context)
    if (result) {
      results.push(result)
      asDynamic && pushDynamicExpressions(result.key, result.value)
    }
  }

  // take rest of props as dynamic props
  if (dynamicArgs.length || results.some(({ key }) => !key.isStatic)) {
    pushMergeArg()
  }

  // has dynamic key or v-bind="{}"
  if (dynamicArgs.length) {
    context.registerEffect(dynamicExpr, [
      {
        type: IRNodeTypes.SET_DYNAMIC_PROPS,
        element: context.reference(),
        props: dynamicArgs,
      },
    ])
  } else {
    results = dedupeProperties(results)
    for (const result of results) {
      if (isStatic(result)) {
        context.template += ` ${result.key.content}`
        if (result.value.content)
          context.template += `="${result.value.content}"`
      } else {
        const expressions = isArray(result.value)
          ? result.value.filter(v => !v.isStatic)
          : [result.value]
        context.registerEffect(expressions, [
          {
            type: IRNodeTypes.SET_PROP,
            element: context.reference(),
            prop: result,
          },
        ])
      }
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
    return {
      key: createSimpleExpression(prop.name, true, prop.nameLoc),
      value: createSimpleExpression(
        prop.value ? prop.value.content : '',
        true,
        prop.value && prop.value.loc,
      ),
    }
  }

  const directiveTransform = context.options.directiveTransforms[name]
  if (directiveTransform) {
    return directiveTransform(prop, node, context)
  }

  // is column directive
  if (!isBuiltInDirective(name)) {
    context.registerOperation({
      type: IRNodeTypes.WITH_DIRECTIVE,
      element: context.reference(),
      dir: prop,
    })
  }
}

function isStatic(
  prop: DirectiveTransformResult,
): prop is DirectiveTransformResult<SimpleExpressionNode> {
  const { key, value } = prop
  return key.isStatic && !isArray(value) && value.isStatic
}

// Dedupe props in an object literal.
// Literal duplicated attributes would have been warned during the parse phase,
// however, it's possible to encounter duplicated `onXXX` handlers with different
// modifiers. We also need to merge static and dynamic class / style attributes.
// - onXXX handlers / style: merge into array
// - class: merge into single expression with concatenation
function dedupeProperties(
  properties: DirectiveTransformResult[],
): DirectiveTransformResult[] {
  const knownProps: Map<string, DirectiveTransformResult> = new Map()
  const deduped: DirectiveTransformResult[] = []
  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i]
    // dynamic keys are always allowed
    if (!prop.key.isStatic) {
      deduped.push(prop)
      continue
    }
    const name = prop.key.content
    const existing = knownProps.get(name)
    if (existing) {
      if (name === 'style' || name === 'class') {
        mergeAsArray(existing, prop)
      }
      // unexpected duplicate, should have emitted error during parse
    } else {
      knownProps.set(name, prop)
      deduped.push(prop)
    }
  }
  return deduped
}

function mergeAsArray(
  existing: DirectiveTransformResult,
  incoming: DirectiveTransformResult,
) {
  const newValues = isArray(incoming.value) ? incoming.value : [incoming.value]
  if (isArray(existing.value)) {
    existing.value.push(...newValues)
  } else {
    existing.value = [existing.value, ...newValues]
  }
}
