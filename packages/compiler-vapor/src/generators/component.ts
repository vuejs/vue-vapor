import type { CodegenContext } from '../generate'
import type { CreateComponentIRNode } from '../ir'
import { type CodeFragment, NEWLINE, genCall } from './utils'

export function genCreateComponent(
  oper: CreateComponentIRNode,
  context: CodegenContext,
): CodeFragment[] {
  const { vaporHelper } = context

  const tag = oper.resolve
    ? genCall(vaporHelper('resolveComponent'), JSON.stringify(oper.tag))
    : [oper.tag]

  return [
    NEWLINE,
    `const n${oper.id} = `,
    ...genCall(vaporHelper('createComponent'), tag),
  ]
}
