import {
  type AttributeNode,
  type DirectiveNode,
  type ElementNode,
  ElementTypes,
  ErrorCodes,
  NodeTypes,
  type SimpleExpressionNode,
  createCompilerError,
  createSimpleExpression,
  isStaticArgOf,
  isStaticExp,
} from '@vue/compiler-core'
import type { NodeTransform, TransformContext } from '../transform'
import {
  type BlockIRNode,
  DynamicFlag,
  IRNodeTypes,
  type IRProps,
  type VaporDirectiveNode,
} from '../ir'
import { camelize, extend, isBuiltInDirective } from '@vue/shared'
import { newBlock } from './utils'
import { buildProps } from './transformElement'

export const transformSlotOutlet: NodeTransform = (node, context) => {
  if (node.type !== NodeTypes.ELEMENT || node.tag !== 'slot') {
    return
  }
  const { props } = node
  const id = context.reference()
  context.dynamic.flags |= DynamicFlag.INSERT
  const [fallback, exitBlock] = createFallback(
    node,
    context as TransformContext<ElementNode>,
  )

  let name: SimpleExpressionNode | undefined
  const nonNameProps: (AttributeNode | DirectiveNode)[] = []
  const directives: DirectiveNode[] = []
  for (const prop of props) {
    if (prop.type === NodeTypes.ATTRIBUTE) {
      if (prop.value) {
        if (prop.name === 'name') {
          name = createSimpleExpression(prop.value.content, true, prop.loc)
        } else {
          nonNameProps.push(extend({}, prop, { name: camelize(prop.name) }))
        }
      }
    } else if (prop.name === 'bind' && isStaticArgOf(prop.arg, 'name')) {
      if (prop.exp) {
        name = (prop as VaporDirectiveNode).exp!
      } else if (prop.arg && prop.arg.type === NodeTypes.SIMPLE_EXPRESSION) {
        // v-bind shorthand syntax
        name = createSimpleExpression(
          camelize(prop.arg.content),
          false,
          prop.arg.loc,
        )
        name.ast = null
      }
    } else if (!isBuiltInDirective(prop.name)) {
      directives.push(prop)
    } else {
      const nonProp = extend({}, prop)
      if (nonProp.name === 'bind' && nonProp.arg && isStaticExp(nonProp.arg)) {
        nonProp.arg = extend({}, nonProp.arg, {
          content: camelize(nonProp.arg.content),
        })
      }
      nonNameProps.push(nonProp)
    }
  }

  if (directives.length) {
    context.options.onError(
      createCompilerError(
        ErrorCodes.X_V_SLOT_UNEXPECTED_DIRECTIVE_ON_SLOT_OUTLET,
        directives[0].loc,
      ),
    )
  }

  name ||= createSimpleExpression('default', true)
  let irProps: IRProps[] = []
  if (nonNameProps.length > 0) {
    const [isDynamic, props] = buildProps(
      extend({}, node, { props: nonNameProps }),
      context as TransformContext<ElementNode>,
      true,
    )
    irProps = isDynamic ? props : [props]
  }

  return () => {
    exitBlock && exitBlock()
    context.registerOperation({
      type: IRNodeTypes.SLOT_OUTLET_NODE,
      id,
      name,
      props: irProps,
      fallback,
    })
  }
}

function createFallback(
  node: ElementNode,
  context: TransformContext<ElementNode>,
): [block?: BlockIRNode, exit?: () => void] {
  if (!node.children.length) {
    return []
  }

  context.node = node = extend({}, node, {
    type: NodeTypes.ELEMENT,
    tag: 'template',
    props: [],
    tagType: ElementTypes.TEMPLATE,
    children: [...node.children],
  })

  const fallback: BlockIRNode = newBlock(node)
  const exitBlock = context.enterBlock(fallback)
  context.reference()
  return [fallback, exitBlock]
}
