import {
  type ElementNode,
  ElementTypes,
  NodeTypes,
  type SimpleExpressionNode,
  createSimpleExpression,
} from '@vue/compiler-core'
import type { NodeTransform, TransformContext } from '../transform'
import {
  type BlockIRNode,
  DynamicFlag,
  type IRDynamicInfo,
  IRNodeTypes,
  type VaporDirectiveNode,
} from '../ir'
import { camelize, extend } from '@vue/shared'
import { genDefaultDynamic } from './utils'

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
          name = createSimpleExpression(p.value.content, true)
          break
        } else {
          nonNameProps.push(extend({}, p, { name: camelize(p.name) }))
        }
      }
    } else {
      if (p.name === 'name') {
        name = (p as VaporDirectiveNode).exp!
      } else {
        nonNameProps.push(p)
      }
    }
  }
  name ||= createSimpleExpression('default', true)

  return () => {
    exitBlock && exitBlock()
    context.registerOperation({
      type: IRNodeTypes.SLOT_OUTLET_NODE,
      id,
      name,
      props: [],
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
