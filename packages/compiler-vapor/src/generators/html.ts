import type { CodegenContext } from '../generate'
import type { SetHtmlIRNode } from '../ir'
import { genExpression } from './expression'
import { type CodeFragment, NEWLINE, genCall } from './utils'

export function genSetHtml(
  oper: SetHtmlIRNode,
  context: CodegenContext,
  onIdRewrite?: (newName: string, name: string) => string,
): CodeFragment[] {
  const { vaporHelper } = context

  const html = genExpression(oper.value, context, undefined, onIdRewrite)
  return [NEWLINE, ...genCall(vaporHelper('setHtml'), `n${oper.element}`, html)]
}
