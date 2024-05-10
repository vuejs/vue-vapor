import type { CodegenContext } from '../generate'
import type { MemoIRNode } from '../ir'
import { genBlock } from './block'
import { genExpression } from './expression'
import { type CodeFragment, NEWLINE, buildCodeFragment, genCall } from './utils'

export function genCreateMemo(
  oper: MemoIRNode,
  context: CodegenContext,
): CodeFragment[] {
  const { vaporHelper } = context
  const { render, memo, level } = oper
  const [frag, push] = buildCodeFragment()

  const renderBlock = genBlock(render, context, ['_cache'])
  const memoExpr: CodeFragment[] = [
    '() => (',
    ...genExpression(memo, context),
    ')',
  ]

  push(NEWLINE, `const n${oper.id} = `)
  push(
    ...genCall(
      vaporHelper('createMemo'),
      memoExpr,
      renderBlock,
      String(level),
      level > 0 && '_cache',
    ),
  )

  return frag
}
