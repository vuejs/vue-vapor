import type { CodegenContext } from '../generate'
import type { SetHtmlIRNode } from '../ir'
import { genExpression } from './expression'
import { type CodeFragment, NEWLINE, genCall } from './utils'
import { processValue } from './prop'

export function genSetHtml(
  oper: SetHtmlIRNode,
  context: CodegenContext,
): CodeFragment[] {
  const { vaporHelper } = context

  let html = genExpression(oper.value, context, undefined)
  let condition: CodeFragment[]
  ;[condition, html] = processValue(context, html)
  return [
    NEWLINE,
    ...condition,
    ...genCall(vaporHelper('setHtml'), `n${oper.element}`, html),
  ]
}
