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
import { processValue } from './prop'

export function genSetText(
  oper: SetTextIRNode,
  context: CodegenContext,
): CodeFragment[] {
  const { vaporHelper } = context
  const { element, values, inVOnce, inVFor } = oper
  const texts = values.map(value => genExpression(value, context, undefined))
  let condition: CodeFragment[] = []
  let newValues
  if (!inVOnce && !inVFor && texts.length === 1) {
    ;[condition, newValues] = processValue(context, texts[0])
    return [
      NEWLINE,
      ...condition,
      ...genCall(vaporHelper('setText'), `n${element}`, newValues),
    ]
  } else {
    // TODO: handle multiple values
    return [
      NEWLINE,
      ...genCall(vaporHelper('setText'), `n${element}`, ...values),
    ]
  }
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
