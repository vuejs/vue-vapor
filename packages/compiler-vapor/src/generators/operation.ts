import { type IREffect, IRNodeTypes, type OperationNode } from '../ir'
import type { CodegenContext } from '../generate'
import { genInsertNode, genPrependNode } from './dom'
import { genSetDynamicEvents, genSetEvent } from './event'
import { genFor } from './for'
import { genSetHtml } from './html'
import { genIf } from './if'
import { genSetModelValue } from './modelValue'
import { genDynamicProps, genSetInheritAttrs, genSetProp } from './prop'
import { genDeclareOldRef, genSetTemplateRef } from './templateRef'
import { genCreateTextNode, genSetText } from './text'
import {
  type CodeFragment,
  INDENT_END,
  INDENT_START,
  NEWLINE,
  buildCodeFragment,
} from './utils'
import { genCreateComponent } from './component'
import { genSlotOutlet } from './slotOutlet'

export function genOperations(
  opers: OperationNode[],
  context: CodegenContext,
): CodeFragment[] {
  const [frag, push] = buildCodeFragment()
  for (const operation of opers) {
    push(...genOperation(operation, context))
  }
  return frag
}

export function genOperation(
  oper: OperationNode,
  context: CodegenContext,
): CodeFragment[] {
  switch (oper.type) {
    case IRNodeTypes.SET_PROP:
      return genSetProp(oper, context)
    case IRNodeTypes.SET_DYNAMIC_PROPS:
      return genDynamicProps(oper, context)
    case IRNodeTypes.SET_TEXT:
      return genSetText(oper, context)
    case IRNodeTypes.SET_EVENT:
      return genSetEvent(oper, context)
    case IRNodeTypes.SET_DYNAMIC_EVENTS:
      return genSetDynamicEvents(oper, context)
    case IRNodeTypes.SET_HTML:
      return genSetHtml(oper, context)
    case IRNodeTypes.SET_TEMPLATE_REF:
      return genSetTemplateRef(oper, context)
    case IRNodeTypes.SET_MODEL_VALUE:
      return genSetModelValue(oper, context)
    case IRNodeTypes.CREATE_TEXT_NODE:
      return genCreateTextNode(oper, context)
    case IRNodeTypes.INSERT_NODE:
      return genInsertNode(oper, context)
    case IRNodeTypes.PREPEND_NODE:
      return genPrependNode(oper, context)
    case IRNodeTypes.IF:
      return genIf(oper, context)
    case IRNodeTypes.FOR:
      return genFor(oper, context)
    case IRNodeTypes.CREATE_COMPONENT_NODE:
      return genCreateComponent(oper, context)
    case IRNodeTypes.DECLARE_OLD_REF:
      return genDeclareOldRef(oper)
    case IRNodeTypes.SLOT_OUTLET_NODE:
      return genSlotOutlet(oper, context)
    case IRNodeTypes.SET_INHERIT_ATTRS:
      return genSetInheritAttrs(oper, context)
  }

  return []
}

export function genEffects(
  effects: IREffect[],
  context: CodegenContext,
): CodeFragment[] {
  const [frag, push] = buildCodeFragment()
  for (let i = 0; i < effects.length; i++) {
    context.renderEffectRewriten = []
    context.renderEffectCondition = []
    const effect = (context.currentRenderEffect = effects[i])
    push(...genEffect(effect, context))
  }
  return frag
}

export function genEffect(
  { operations }: IREffect,
  context: CodegenContext,
): CodeFragment[] {
  let {
    vaporHelper,
    renderEffectDeps,
    renderEffectCondition,
    renderEffectRewriten,
  } = context
  const [frag, push] = buildCodeFragment(
    NEWLINE,
    `${vaporHelper('renderEffect')}(() => `,
  )

  const operationsExps = genOperations(operations, context)

  if (renderEffectDeps.length) {
    const vars = [...new Set(renderEffectDeps)].map(v => `_${v}`)
    frag.splice(1, 0, `let ${vars.join(', ')};`, NEWLINE)
    context.renderEffectDeps = []
  }

  const newlineCount = operationsExps.filter(frag => frag === NEWLINE).length
  if (newlineCount > 1) {
    // renderEffectCondition.pop()
    const condition: CodeFragment[] =
      renderEffectCondition.length > 0
        ? [
            NEWLINE,
            `if(`,
            ...renderEffectCondition.join(' && '),
            `) return`,
            NEWLINE,
            ...renderEffectRewriten.join(';'),
          ]
        : [undefined]
    push(
      '{',
      INDENT_START,
      ...condition,
      ...operationsExps,
      INDENT_END,
      NEWLINE,
      '})',
    )
  } else {
    push(...operationsExps.filter(frag => frag !== NEWLINE), ')')
  }

  return frag
}
