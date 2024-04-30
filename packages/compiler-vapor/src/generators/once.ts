import type { CodegenContext } from '../generate'
import type { OnceIRNode } from '../ir'
import { genBlock } from './block'
import { type CodeFragment, NEWLINE, buildCodeFragment, genCall } from './utils'

export function genCreateOnce(
  oper: OnceIRNode,
  context: CodegenContext,
): CodeFragment[] {
  const { vaporHelper } = context
  const { block } = oper
  const [frag, push] = buildCodeFragment()

  let arg = genBlock(block, context)

  push(NEWLINE, `const n${oper.id} = `)
  push(...genCall(vaporHelper('createOnce'), arg))

  return frag
}
