import type { CodegenContext } from '../generate'
import type { SetHtmlIRNode } from '../ir'
import { genExpression } from './expression'
import { type CodeFragment, NEWLINE, genCall } from './utils'
import { processValues } from './prop'

export function genSetHtml(
  oper: SetHtmlIRNode,
  context: CodegenContext,
): CodeFragment[] {
  const { vaporHelper, shouldGenEffectDeps } = context
  const { value, element } = oper
  let html = genExpression(value, context)
  if (shouldGenEffectDeps()) {
    processValues(context, [html])
  }
  return [NEWLINE, ...genCall(vaporHelper('setHtml'), `n${element}`, html)]
}
