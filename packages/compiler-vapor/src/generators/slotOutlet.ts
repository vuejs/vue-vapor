import type { CodegenContext } from '../generate'
import type { SlotOutletIRNode } from '../ir'
import { genBlock } from './block'
import { genExpression } from './expression'
import { type CodeFragment, NEWLINE, buildCodeFragment, genCall } from './utils'

export function genSlotOutlet(oper: SlotOutletIRNode, context: CodegenContext) {
  const { vaporHelper } = context
  const { id, name, fallback } = oper
  const [frag, push] = buildCodeFragment()

  const nameExpr = genExpression(name, context)

  let fallbackArg: false | CodeFragment[] = false
  if (fallback) {
    fallbackArg = genBlock(fallback, context)
  }

  push(NEWLINE, `const n${id} = `)
  push(...genCall(vaporHelper('createSlot'), nameExpr, false, fallbackArg))

  return frag
}
