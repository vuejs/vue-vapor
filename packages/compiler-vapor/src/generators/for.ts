import { NewlineType } from '@vue/compiler-dom'
import { genBlockFunction } from './block'
import { genExpression } from './expression'
import type { CodeFragment, CodegenContext } from '../generate'
import type { ForIRNode } from '../ir'

export function genFor(
  oper: ForIRNode,
  context: CodegenContext,
): CodeFragment[] {
  const { newline, call, vaporHelper } = context
  const { source, value, render } = oper

  return [
    newline(),
    `const n${oper.id} = `,
    ...call(
      vaporHelper('createFor'),
      ['() => ', ...genExpression(source, context)],
      genBlockFunction(render, context, [
        [value.content, NewlineType.None, value.loc],
      ]),
    ),
  ]
}
