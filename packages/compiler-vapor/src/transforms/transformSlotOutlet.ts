import {
  type ElementNode,
  ElementTypes,
  NodeTypes,
  type SimpleExpressionNode,
  createSimpleExpression,
  isStaticArgOf,
  isStaticExp,
} from '@vue/compiler-core'
import type { NodeTransform, TransformContext } from '../transform'
import {
  type BlockIRNode,
  DynamicFlag,
  type IRDynamicInfo,
  IRNodeTypes,
  type IRProps,
  type VaporDirectiveNode,
} from '../ir'
import { camelize, extend } from '@vue/shared'
import { genDefaultDynamic } from './utils'
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
  const nonNameProps = []
  for (const p of props) {
    if (p.type === NodeTypes.ATTRIBUTE) {
      if (p.value) {
        if (p.name === 'name') {
          name = createSimpleExpression(p.value.content, true, p.loc)
        } else {
          p.name = camelize(p.name)
          nonNameProps.push(p)
        }
      }
    } else {
      if (p.name === 'bind' && isStaticArgOf(p.arg, 'name')) {
        if (p.exp) {
          name = (p as VaporDirectiveNode).exp!
        } else if (p.arg && p.arg.type === NodeTypes.SIMPLE_EXPRESSION) {
          // v-bind shorthand syntax
          name = createSimpleExpression(
            camelize(p.arg.content),
            false,
            p.arg.loc,
          )
          name.ast = null
        }
      } else {
        if (p.name === 'bind' && p.arg && isStaticExp(p.arg)) {
          p.arg.content = camelize(p.arg.content)
        }
        nonNameProps.push(p)
      }
    }
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
): [BlockIRNode | undefined, (() => void) | undefined] {
  if (!node.children.length) {
    return [undefined, undefined]
  }

  context.node = node = extend({}, node, {
    type: NodeTypes.ELEMENT,
    tag: 'template',
    props: [],
    tagType: ElementTypes.TEMPLATE,
    children: [...node.children],
  })

  const fallback: BlockIRNode = {
    type: IRNodeTypes.BLOCK,
    node,
    dynamic: extend(genDefaultDynamic(), {
      flags: DynamicFlag.REFERENCED,
    } satisfies Partial<IRDynamicInfo>),
    effect: [],
    operation: [],
    returns: [],
  }

  const exitBlock = context.enterBlock(fallback)
  context.reference()
  return [fallback, exitBlock]
}
