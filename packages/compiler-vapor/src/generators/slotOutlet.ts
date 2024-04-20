import { isArray } from '@vue/shared'
import type { CodegenContext } from '../generate'
import type { IRProp, SlotOutletIRNode } from '../ir'
import { genBlock } from './block'
import { genExpression } from './expression'
import {
  type CodeFragment,
  INDENT_END,
  INDENT_START,
  NEWLINE,
  buildCodeFragment,
  genCall,
  genMulti,
} from './utils'
import { genPropKey } from './prop'
import { genEventHandler } from './event'

export function genSlotOutlet(oper: SlotOutletIRNode, context: CodegenContext) {
  const { helper, vaporHelper } = context
  const { id, name, fallback } = oper
  const [frag, push] = buildCodeFragment()

  const nameExpr = name.isStatic
    ? genExpression(name, context)
    : ['() => (', ...genExpression(name, context), ')']

  let fallbackArg: false | CodeFragment[] = false
  if (fallback) {
    fallbackArg = genBlock(fallback, context)
  }

  push(NEWLINE, `const n${id} = `)
  push(
    ...genCall(
      vaporHelper('createSlot'),
      nameExpr,
      genRawProps() || false,
      fallbackArg,
    ),
  )

  return frag

  // TODO share this with genCreateComponent
  function genRawProps() {
    const props = oper.props
      .map(props => {
        if (isArray(props)) {
          if (!props.length) return
          return genStaticProps(props)
        } else {
          let expr = genExpression(props.value, context)
          if (props.handler) expr = genCall(helper('toHandlers'), expr)
          return ['() => (', ...expr, ')']
        }
      })
      .filter(Boolean)
    if (props.length) {
      return genMulti(['[', ']', ', '], ...props)
    }
  }

  function genStaticProps(props: IRProp[]) {
    return genMulti(
      [
        ['{', INDENT_START, NEWLINE],
        [INDENT_END, NEWLINE, '}'],
        [', ', NEWLINE],
      ],
      ...props.map(prop => {
        return [
          ...genPropKey(prop, context),
          ': ',
          ...(prop.handler
            ? genEventHandler(context, prop.values[0])
            : ['() => (', ...genExpression(prop.values[0], context), ')']),
        ]
      }),
    )
  }
}
