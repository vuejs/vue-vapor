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
    const effect = (context.processingRenderEffect = effects[i])
    push(...genEffect(effect, context))
  }
  return frag
}

export function genEffect(
  { operations }: IREffect,
  context: CodegenContext,
): CodeFragment[] {
  const { vaporHelper, processingRenderEffect } = context
  const [frag, push] = buildCodeFragment(
    NEWLINE,
    `${vaporHelper('renderEffect')}(() => `,
  )
  const { declareNames, earlyCheckExps } = processingRenderEffect!
  const operationsExps = genOperations(operations, context)

  // declare variables: let _foo, _bar
  if (declareNames.size) {
    frag.splice(1, 0, `let ${[...declareNames].join(', ')}`, NEWLINE)
  }

  const newlineCount = operationsExps.filter(frag => frag === NEWLINE).length
  if (newlineCount > 1) {
    // multiline early return condition: if (_foo !== _ctx.foo || _bar !== _ctx.bar) {
    const checkExpsStart: CodeFragment[] =
      earlyCheckExps.length > 0
        ? [NEWLINE, `if(`, ...earlyCheckExps.join(' || '), `) {`, INDENT_START]
        : []
    const checkExpsEnd: CodeFragment[] =
      earlyCheckExps.length > 0 ? [INDENT_END, NEWLINE, '}'] : []
    // assignment: _foo = _ctx.foo; _bar = _ctx.bar
    const assignmentExps: CodeFragment[] =
      earlyCheckExps.length > 0
        ? [NEWLINE, ...earlyCheckExps.map(c => c.replace('!==', '=')).join(';')]
        : []
    push(
      '{',
      INDENT_START,
      ...checkExpsStart,
      ...operationsExps,
      ...assignmentExps,
      ...checkExpsEnd,
      INDENT_END,
      NEWLINE,
      '})',
    )
  } else {
    // single line early return condition: (_foo !== _ctx.foo || _bar !== _ctx.bar) &&
    const multiple = earlyCheckExps.length > 1
    const checkExps: CodeFragment[] =
      earlyCheckExps.length > 0
        ? [
            multiple ? `(` : undefined,
            ...earlyCheckExps.join(' || '),
            multiple ? `)` : undefined,
            ' && ',
          ]
        : []
    push(...checkExps, ...operationsExps.filter(frag => frag !== NEWLINE), ')')
  }

  return frag
}
