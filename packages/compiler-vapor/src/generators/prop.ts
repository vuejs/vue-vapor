import {
  type CodeFragment,
  type CodegenContext,
  NEWLINE,
  buildCodeFragment,
} from '../generate'
import type { SetMergePropsIRNode, SetPropsIRNode, VaporHelper } from '../ir'
import { genExpression } from './expression'
import { isString } from '@vue/shared'
import type { DirectiveTransformResult } from '../transform'
import { isSimpleIdentifier } from '@vue/compiler-core'

// only the static arg props will reach here
export function genSetProps(
  oper: SetPropsIRNode,
  context: CodegenContext,
): CodeFragment[] {
  const { call, vaporHelper } = context
  const [frag, push] = buildCodeFragment()

  oper.value.forEach(({ key, value, modifier }) => {
    const keyName = isString(key) ? key : key.content

    let helperName: VaporHelper
    let omitKey = false
    if (keyName === 'class') {
      helperName = 'setClass'
      omitKey = true
    } else if (keyName === 'style') {
      helperName = 'setStyle'
      omitKey = true
    } else if (modifier) {
      helperName = modifier === '.' ? 'setDOMProp' : 'setAttr'
    } else {
      helperName = 'setDynamicProp'
    }

    push(
      NEWLINE,
      ...call(
        vaporHelper(helperName),
        `n${oper.element}`,
        omitKey ? false : genExpression(key, context),
        genExpression(value, context),
      ),
    )
  })

  return frag
}

// dynamic arg props and v-bind="{}" will reach here
export function genSetMergeProps(
  oper: SetMergePropsIRNode,
  context: CodegenContext,
): CodeFragment[] {
  const { call, vaporHelper } = context

  return [
    NEWLINE,
    ...call(
      vaporHelper('setMergeProps'),
      `n${oper.element}`,
      ...oper.value.map(
        props =>
          Array.isArray(props)
            ? genLiteralObjectProps(props, context) // static and dynamic arg props
            : genExpression(props, context), // v-bind="{}"
      ),
    ),
  ]
}

function genLiteralObjectProps(
  props: DirectiveTransformResult[],
  context: CodegenContext,
): CodeFragment[] {
  const [frag, push] = buildCodeFragment()
  const multilines = props.length > 1

  push(multilines ? `{` : `{ `)
  props.forEach((prop, i) => {
    const { value } = prop
    // key
    push(...genPropertyKey(prop, context))
    push(`: `)
    // value
    push(...genExpression(value, context))
    if (i < props.length - 1) {
      // will only reach this if it's multilines
      push(`,`, NEWLINE)
    }
  })
  push(multilines ? `}` : ` }`)

  return frag
}

function genPropertyKey(
  { key: node, runtimeCamelize, modifier }: DirectiveTransformResult,
  context: CodegenContext,
): CodeFragment[] {
  const { call, helper } = context

  // static arg was transformed by v-bind transformer
  if (isString(node) || node.isStatic) {
    // only quote keys if necessary
    const keyName = isString(node) ? node : node.content
    return [isSimpleIdentifier(keyName) ? keyName : JSON.stringify(keyName)]
  }

  const key = genExpression(node, context)
  if (runtimeCamelize && modifier) {
    return [`[\`${modifier}\${`, ...call(helper('camelize'), key), `}\`]`]
  }

  if (runtimeCamelize) {
    return [`[`, ...call(helper('camelize'), key), `]`]
  }

  if (modifier) {
    return [`[\`${modifier}\${`, ...key, `}\`]`]
  }

  return [`[`, ...key, `]`]
}
