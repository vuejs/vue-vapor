import type { SimpleExpressionNode } from '@vue/compiler-dom'
import type { DirectiveTransformResult } from '../transform'
import type { BlockIRNode, IRFor } from './index'

// props
export interface IRProp extends Omit<DirectiveTransformResult, 'value'> {
  values: SimpleExpressionNode[]
}

export enum IRDynamicPropsKind {
  EXPRESSION, // v-bind="value"
  ATTRIBUTE, // v-bind:[foo]="value"
}

export type IRPropsStatic = IRProp[]
export interface IRPropsDynamicExpression {
  kind: IRDynamicPropsKind.EXPRESSION
  value: SimpleExpressionNode
  handler?: boolean
}
export interface IRPropsDynamicAttribute extends IRProp {
  kind: IRDynamicPropsKind.ATTRIBUTE
}
export type IRProps =
  | IRPropsStatic
  | IRPropsDynamicAttribute
  | IRPropsDynamicExpression

// slots
export interface SlotBlockIRNode extends BlockIRNode {
  props?: SimpleExpressionNode
}
export type IRSlotsStatic = Record<string, SlotBlockIRNode>

export enum DynamicSlotType {
  BASIC,
  LOOP,
  CONDITIONAL,
}
export interface IRSlotDynamicBasic {
  slotType: DynamicSlotType.BASIC
  name: SimpleExpressionNode
  fn: SlotBlockIRNode
}
export interface IRSlotDynamicLoop {
  slotType: DynamicSlotType.LOOP
  name: SimpleExpressionNode
  fn: SlotBlockIRNode
  loop: IRFor
}
export interface IRSlotDynamicConditional {
  slotType: DynamicSlotType.CONDITIONAL
  condition: SimpleExpressionNode
  positive: IRSlotDynamicBasic
  negative?: IRSlotDynamicBasic | IRSlotDynamicConditional
}

export type IRSlotDynamic =
  | IRSlotDynamicBasic
  | IRSlotDynamicLoop
  | IRSlotDynamicConditional
export type IRSlots = IRSlotsStatic | IRSlotDynamic

export function isStaticSlotIR(slot: IRSlots): slot is IRSlotsStatic {
  return !('slotType' in slot)
}
