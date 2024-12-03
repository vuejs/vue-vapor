import type { CodegenContext } from '../generate'
import type { SetHtmlIRNode } from '../ir'
import { genExpression } from './expression'
import { type CodeFragment, NEWLINE, genCall } from './utils'
import { processValues } from './prop'

export function genSetHtml(
  oper: SetHtmlIRNode,
  context: CodegenContext,
): CodeFragment[] {
  const { vaporHelper } = context
  const { value, element, inVOnce, inVFor } = oper
  let html = genExpression(value, context, undefined)
  let condition: CodeFragment[] = []
  if (!inVOnce && !inVFor) {
    condition = processValues(context, [html])
  }
  return [
    NEWLINE,
    ...condition,
    ...genCall(vaporHelper('setHtml'), `n${element}`, html),
  ]
}
