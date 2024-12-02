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
): CodeFragment[] {
  const { vaporHelper, renderEffectDeps, block } = context
  const { element, values } = oper
  const inEffect = block.effect.length
  let newPropName, propName
  function onIdRewrite(newName: string, name: string) {
    renderEffectDeps.add(name)
    return `_${(propName = name)} = ${(newPropName = newName)}`
  }
  const texts = values.map(value =>
    genExpression(
      value,
      context,
      undefined,
      inEffect ? onIdRewrite : undefined,
    ),
  )
  return [
    NEWLINE,
    newPropName ? `_${propName} !== ${newPropName} && ` : undefined,
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
