import {
  type ElementNode,
  ElementTypes,
  ErrorCodes,
  NodeTypes,
  type SimpleExpressionNode,
  type TemplateChildNode,
  createCompilerError,
  isTemplateNode,
  isVSlot,
} from '@vue/compiler-core'
import type { NodeTransform, TransformContext } from '../transform'
import { newBlock } from './utils'
import {
  DynamicFlag,
  DynamicSlotType,
  type IRFor,
  type IRSlotDynamic,
  type IRSlotDynamicBasic,
  type IRSlotDynamicConditional,
  type IRSlots,
  type IRSlotsStatic,
  type SlotBlockIRNode,
  type VaporDirectiveNode,
  isStaticSlotIR,
} from '../ir'
import { findDir, resolveExpression } from '../utils'

export const transformVSlot: NodeTransform = (node, context) => {
  if (node.type !== NodeTypes.ELEMENT) return

  const dir = findDir(node, 'slot', true)
  const { tagType, children } = node
  const { parent } = context

  const isComponent = tagType === ElementTypes.COMPONENT
  const isSlotTemplate =
    isTemplateNode(node) &&
    parent &&
    parent.node.type === NodeTypes.ELEMENT &&
    parent.node.tagType === ElementTypes.COMPONENT

  if (isComponent && children.length) {
    const arg = dir && dir.arg
    const nonSlotTemplateChildren = children.filter(
      n =>
        isNonWhitespaceContent(node) &&
        !(n.type === NodeTypes.ELEMENT && n.props.some(isVSlot)),
    )

    const [block, onExit] = createSlotBlock(
      node,
      dir,
      context as TransformContext<ElementNode>,
    )

    const slots = context.slots

    return () => {
      onExit()

      const hasOtherSlots = !!slots.length
      if (dir && hasOtherSlots) {
        // already has on-component slot - this is incorrect usage.
        context.options.onError(
          createCompilerError(ErrorCodes.X_V_SLOT_MIXED_SLOT_USAGE, dir.loc),
        )
        // TODO remove old one
      }

      if (nonSlotTemplateChildren.length) {
        if (hasStaticSlot(slots, 'default')) {
          context.options.onError(
            createCompilerError(
              ErrorCodes.X_V_SLOT_EXTRANEOUS_DEFAULT_SLOT_CHILDREN,
              nonSlotTemplateChildren[0].loc,
            ),
          )
        } else {
          registerSlot(slots, arg, block)
          context.slots = slots
        }
      } else if (hasOtherSlots) {
        context.slots = slots
      }
    }
  } else if (isSlotTemplate && dir) {
    context.dynamic.flags |= DynamicFlag.NON_TEMPLATE

    const arg = dir.arg && resolveExpression(dir.arg)
    const vFor = findDir(node, 'for')
    const vIf = findDir(node, 'if')
    const vElse = findDir(node, /^else(-if)?$/, true /* allowEmpty */)
    const slots = context.slots
    const [block, onExit] = createSlotBlock(
      node,
      dir,
      context as TransformContext<ElementNode>,
    )

    if (!vFor && !vIf && !vElse) {
      const slotName = arg ? arg.isStatic && arg.content : 'default'
      if (slotName && hasStaticSlot(slots, slotName)) {
        context.options.onError(
          createCompilerError(
            ErrorCodes.X_V_SLOT_DUPLICATE_SLOT_NAMES,
            dir.loc,
          ),
        )
      } else {
        registerSlot(slots, arg, block)
      }
    } else if (vIf) {
      registerDynamicSlot(slots, {
        slotType: DynamicSlotType.CONDITIONAL,
        condition: vIf.exp!,
        positive: {
          slotType: DynamicSlotType.BASIC,
          name: arg!,
          fn: block,
        },
      })
    } else if (vElse) {
      const vIfSlot = slots[slots.length - 1] as IRSlotDynamic
      if (vIfSlot.slotType === DynamicSlotType.CONDITIONAL) {
        let ifNode = vIfSlot
        while (
          ifNode.negative &&
          ifNode.negative.slotType === DynamicSlotType.CONDITIONAL
        )
          ifNode = ifNode.negative
        const negative: IRSlotDynamicBasic | IRSlotDynamicConditional =
          vElse.exp
            ? {
                slotType: DynamicSlotType.CONDITIONAL,
                condition: vElse.exp,
                positive: {
                  slotType: DynamicSlotType.BASIC,
                  name: arg!,
                  fn: block,
                },
              }
            : {
                slotType: DynamicSlotType.BASIC,
                name: arg!,
                fn: block,
              }
        ifNode.negative = negative
      } else {
        context.options.onError(
          createCompilerError(ErrorCodes.X_V_ELSE_NO_ADJACENT_IF, vElse.loc),
        )
      }
    } else if (vFor) {
      if (vFor.forParseResult) {
        registerDynamicSlot(slots, {
          slotType: DynamicSlotType.LOOP,
          name: arg!,
          fn: block,
          loop: vFor.forParseResult as IRFor,
        })
      } else {
        context.options.onError(
          createCompilerError(
            ErrorCodes.X_V_FOR_MALFORMED_EXPRESSION,
            vFor.loc,
          ),
        )
      }
    }

    return onExit
  } else if (!isComponent && dir) {
    context.options.onError(
      createCompilerError(ErrorCodes.X_V_SLOT_MISPLACED, dir.loc),
    )
  }
}

// <Foo v-slot:default>
// function transformComponentSlot(
//   node: ElementNode,
//   dir: VaporDirectiveNode | undefined,
//   context: TransformContext,
// ) {
//   const { children } = node
//   const { slots } = context

// }

function ensureStaticSlots(slots: IRSlots[]): IRSlots {
  let lastSlots = slots[slots.length - 1]
  if (!slots.length || !isStaticSlotIR(lastSlots)) {
    slots.push((lastSlots = {}))
  }
  return lastSlots
}

function registerSlot(
  allSlots: IRSlots[],
  name: SimpleExpressionNode | undefined,
  block: SlotBlockIRNode,
) {
  const isStatic = !name || name.isStatic
  const slots = isStatic ? ensureStaticSlots(allSlots) : allSlots
  if (isStatic) {
    ;(slots as IRSlotsStatic)[name ? name.content : 'default'] = block
  } else {
    ;(slots as IRSlots[]).push({
      slotType: DynamicSlotType.BASIC,
      name: name!,
      fn: block,
    })
  }
}

function registerDynamicSlot(allSlots: IRSlots[], dynamic: IRSlotDynamic) {
  allSlots.push(dynamic)
}

function hasStaticSlot(slots: IRSlots[], name: string) {
  return slots.some(slot => {
    if (isStaticSlotIR(slot)) return !!slot[name]
  })
}

function createSlotBlock(
  slotNode: ElementNode,
  dir: VaporDirectiveNode | undefined,
  context: TransformContext<ElementNode>,
): [SlotBlockIRNode, () => void] {
  const block: SlotBlockIRNode = newBlock(slotNode)
  block.props = dir && dir.exp
  const exitBlock = context.enterBlock(block)
  return [block, exitBlock]
}

function isNonWhitespaceContent(node: TemplateChildNode): boolean {
  if (node.type !== NodeTypes.TEXT) return true
  return !!node.content.trim()
}
