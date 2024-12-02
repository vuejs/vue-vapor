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

export function genSetText(
  oper: SetTextIRNode,
  context: CodegenContext,
  onIdRewrite?: (newName: string, name: string) => string,
): CodeFragment[] {
  const { vaporHelper } = context
  const { element, values } = oper
  const texts = values.map(value =>
    genExpression(
      value,
      context,
      undefined,
      // TODO values.length > 1
      values.length === 1 ? onIdRewrite : undefined,
    ),
  )
  return [NEWLINE, ...genCall(vaporHelper('setText'), `n${element}`, ...texts)]
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
