import type { CodegenContext } from '../generate'
import type { SetPropIRNode } from '../ir'
import { genExpression } from './expression'
import { isString } from '@vue/shared'

export function genSetProp(oper: SetPropIRNode, context: CodegenContext) {
  const { pushFnCall, pushMulti, newline, vaporHelper, helper } = context

  newline()

  if (isString(oper.key) || oper.key.isStatic) {
    let keyName: string = isString(oper.key)
      ? oper.key
      : JSON.stringify(oper.key)

    if (keyName === 'class') {
      pushFnCall(vaporHelper('setClass'), `n${oper.element}`, 'undefined', () =>
        genExpression(oper.value, context),
      )
      return
    }

    if (keyName === 'style') {
      pushFnCall(vaporHelper('setStyle'), `n${oper.element}`, 'undefined', () =>
        genExpression(oper.value, context),
      )
      return
    }

    if (oper.runtimePrefix) {
      pushFnCall(
        vaporHelper(oper.runtimePrefix === '.' ? 'setDOMProp' : 'setAttr'),
        `n${oper.element}`,
        () => {
          if (oper.runtimeCamelize) {
            pushFnCall(helper('camelize'), () =>
              genExpression(oper.key, context),
            )
          } else {
            genExpression(oper.key, context)
          }
        },
        'undefined',
        () => genExpression(oper.value, context),
      )
      return
    }
  }

  pushFnCall(
    vaporHelper('setDynamicProp'),
    `n${oper.element}`,
    // 2. key name
    () => {
      if (oper.runtimeCamelize) {
        pushFnCall(helper('camelize'), () => genExpression(oper.key, context))
      } else if (oper.runtimePrefix) {
        pushMulti([`\`${oper.runtimePrefix}\${`, `}\``], () =>
          genExpression(oper.key, context),
        )
      } else {
        genExpression(oper.key, context)
      }
    },
    'undefined',
    () => genExpression(oper.value, context),
  )
}
