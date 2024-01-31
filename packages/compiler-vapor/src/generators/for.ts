import { genBlockFunction } from './block'
import { genExpression } from './expression'
import {
  type CodeFragment,
  type CodegenContext,
  buildCodeFragment,
} from '../generate'
import type { ForIRNode } from '../ir'
import { genOperations } from './operation'
import { NewlineType } from '@vue/compiler-dom'

export function genFor(
  oper: ForIRNode,
  context: CodegenContext,
): CodeFragment[] {
  const { newline, call, vaporHelper } = context
  const { source, value, key, render } = oper

  const sourceExpr = ['() => (', ...genExpression(source, context), ')']

  const updateFn = '_updateEffect'
  const destructure: CodeFragment[] | undefined = (value || key) && [
    '[',
    value && [value.content, NewlineType.None, value.loc],
    key && ', ',
    key && [key.content, NewlineType.None, key.loc],
    '] = _block.s',
  ]

  context.effectOverride = effects => {
    const [frag, push] = buildCodeFragment()
    context.withIndent(() => {
      if (destructure) {
        push(newline(), 'const ', ...destructure)
      }
      effects.forEach(effect =>
        push(...genOperations(effect.operations, context)),
      )
    })
    return [
      newline(),
      `const ${updateFn} = () => {`,
      ...frag,
      newline(),
      '}',
      newline(),
      `${vaporHelper('renderEffect')}(${updateFn})`,
    ]
  }

  const blockRet: CodeFragment[] = [
    '[',
    `n${render.dynamic.id!}`,
    `, ${updateFn}]`,
  ]
  const ids = [value && value.content, key && key.content].filter(
    Boolean,
  ) as string[]
  const blockFn = context.withId(
    () =>
      genBlockFunction(
        render,
        context,
        ['_block, ', ...(destructure || [])],
        blockRet,
      ),
    ids,
  )

  context.effectOverride = undefined

  return [
    newline(),
    `const n${oper.id} = `,
    ...call(vaporHelper('createFor'), sourceExpr, blockFn),
  ]
}
