import { type CodegenContext, genBlockFunctionContent } from '../generate'
import type { BlockFunctionIRNode, IfIRNode } from '../ir'
import { genExpression } from './expression'

export function genIf(oper: IfIRNode, context: CodegenContext) {
  const { pushFnCall, vaporHelper, pushNewline, push } = context
  const { condition, truthyBranch, falsyBranch } = oper

  pushNewline(`const n${oper.id} = `)
  pushFnCall(
    vaporHelper('createIf'),
    () => {
      push('() => (')
      genExpression(condition, context)
      push(')')
    },
    () => genBlockFunction(truthyBranch, context),
    !!falsyBranch && (() => genBlockFunction(falsyBranch!, context)),
  )
}

export function genBlockFunction(
  oper: Omit<BlockFunctionIRNode, 'type'>,
  context: CodegenContext,
) {
  const { push, pushNewline, withIndent } = context
  push('() => {')
  withIndent(() => {
    genBlockFunctionContent(oper, context)
  })
  pushNewline('}')
}
