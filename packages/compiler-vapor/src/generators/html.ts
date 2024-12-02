import type { CodegenContext } from '../generate'
import type { SetHtmlIRNode } from '../ir'
import { genExpression } from './expression'
import { type CodeFragment, NEWLINE, genCall } from './utils'

export function genSetHtml(
  oper: SetHtmlIRNode,
  context: CodegenContext,
): CodeFragment[] {
  const { vaporHelper, renderEffectDeps, block } = context
  const inEffect = block.effect.length
  let newPropName, propName
  function onIdRewrite(newName: string, name: string) {
    renderEffectDeps.add(name)
    return `_${(propName = name)} = ${(newPropName = newName)}`
  }
  const html = genExpression(
    oper.value,
    context,
    undefined,
    inEffect ? onIdRewrite : undefined,
  )
  return [
    NEWLINE,
    newPropName ? `_${propName} !== ${newPropName} && ` : undefined,
    ...genCall(vaporHelper('setHtml'), `n${oper.element}`, html),
  ]
}
