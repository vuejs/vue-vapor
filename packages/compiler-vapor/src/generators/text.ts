import type { CodegenContext } from '../generate'
import type { CreateTextNodeIRNode, SetTextIRNode } from '../ir'
import { genExpression } from './expression'
import {
  type CodeFragment,
  DELIMITERS_ARRAY,
  NEWLINE,
  genCall,
  genMulti,
} from './utils'
import { processValues } from './prop'

export function genSetText(
  oper: SetTextIRNode,
  context: CodegenContext,
): CodeFragment[] {
  const { vaporHelper, currentRenderEffect } = context
  const { element, values } = oper
  const { inVFor, inVOnce } = currentRenderEffect!
  const texts = values.map(value => genExpression(value, context, undefined))
  let conditions: CodeFragment[] = []
  if (!inVOnce && !inVFor) {
    conditions = processValues(context, texts)
  }
  return [
    NEWLINE,
    ...conditions,
    ...genCall(vaporHelper('setText'), `n${element}`, ...texts),
  ]
}

export function genCreateTextNode(
  oper: CreateTextNodeIRNode,
  context: CodegenContext,
): CodeFragment[] {
  const { vaporHelper } = context
  const { id, values, effect } = oper
  return [
    NEWLINE,
    `const n${id} = `,
    ...genCall(vaporHelper('createTextNode'), [
      effect && '() => ',
      ...genMulti(
        DELIMITERS_ARRAY,
        ...values.map(value => genExpression(value, context)),
      ),
    ]),
  ]
}
