import {
  type ElementNode,
  ElementTypes,
  NodeTypes,
  createSimpleExpression,
  isTemplateNode,
  isVSlot,
} from '@vue/compiler-core'
import type { NodeTransform, TransformContext } from '../transform'
import { newBlock } from './utils'
import { type BlockIRNode, DynamicFlag, type VaporDirectiveNode } from '../ir'
import { findDir } from '../utils'

// TODO dynamic slots
export const transformVSlot: NodeTransform = (node, context) => {
  if (node.type !== NodeTypes.ELEMENT) return

  const { tagType, children } = node
  const { parent } = context
  let dir: VaporDirectiveNode | undefined

  const isDefaultSlot = tagType === ElementTypes.COMPONENT && children.length
  const isSlotTemplate =
    isTemplateNode(node) &&
    parent &&
    parent.node.type === NodeTypes.ELEMENT &&
    parent.node.tagType === ElementTypes.COMPONENT

  if (isDefaultSlot) {
    const hasDefalutSlot = children.some(
      n => !(n.type === NodeTypes.ELEMENT && n.props.some(isVSlot)),
    )

    const [block, onExit] = createSlotBlock(
      node,
      context as TransformContext<ElementNode>,
    )

    const slots = (context.slots ||= [])

    return () => {
      onExit()
      if (hasDefalutSlot)
        slots.push({
          name: createSimpleExpression('default', true),
          block,
        })
      if (slots.length) context.slots = slots
    }
  } else if (isSlotTemplate && (dir = findDir(node, 'slot', true))) {
    context.dynamic.flags |= DynamicFlag.NON_TEMPLATE

    const slots = context.slots!

    const [block, onExit] = createSlotBlock(
      node,
      context as TransformContext<ElementNode>,
    )

    slots.push({
      name: dir.arg!,
      block,
    })
    return () => onExit()
  }
}

function createSlotBlock(
  slotNode: ElementNode,
  context: TransformContext<ElementNode>,
): [BlockIRNode, () => void] {
  const branch: BlockIRNode = newBlock(slotNode)
  const exitBlock = context.enterBlock(branch)
  return [branch, exitBlock]
}
