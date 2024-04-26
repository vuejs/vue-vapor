import { genExpression } from './expression'
import type { CodegenContext } from '../generate'
import type { SetRefIRNode } from '../ir'
import { type CodeFragment, NEWLINE, genCall } from './utils'

export function genSetRef(
  oper: SetRefIRNode,
  context: CodegenContext,
): CodeFragment[] {
  const { vaporHelper } = context
  const dynamicExp = oper.refCount !== -1
  return [
    NEWLINE,
    dynamicExp && `let r${oper.refCount}`,
    dynamicExp && NEWLINE,
    ...(!!dynamicExp
      ? [`${vaporHelper('renderEffect')}(() => `, `r${oper.refCount} = `]
      : []),
    ...genCall(
      vaporHelper('setRef'),
      [`n${oper.element}`],
      genExpression(oper.value, context),
      dynamicExp ? `r${oper.refCount}` : oper.refFor ? 'void 0' : undefined,
      oper.refFor && 'true',
    ),
    !!dynamicExp && ')',
  ]
}
