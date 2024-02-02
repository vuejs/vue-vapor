import {
  type CodeFragment,
  type CodegenContext,
  NEWLINE,
  buildCodeFragment,
} from '../generate'
import type {
  SetDynamicPropsIRNode,
  SetMergePropsIRNode,
  SetPropsIRNode,
  VaporHelper,
} from '../ir'
import { genExpression } from './expression'
import { isString } from '@vue/shared'
import type { DirectiveTransformResult } from '../transform'
import {
  type ObjectExpression,
  createObjectExpression,
  createObjectProperty,
} from '@vue/compiler-core'
import { genObjectExpression } from './objectExpression'

export function genSetProps(
  oper: SetPropsIRNode,
  context: CodegenContext,
): CodeFragment[] {
  const { call, vaporHelper } = context
  const [frag, push] = buildCodeFragment()

  oper.value.forEach(({ key, value, modifier }) => {
    const keyName = isString(key) ? key : key.content

    let helperName: VaporHelper | undefined
    let omitKey = false
    if (keyName === 'class') {
      helperName = 'setClass'
      omitKey = true
    } else if (keyName === 'style') {
      helperName = 'setStyle'
      omitKey = true
    } else if (modifier) {
      helperName = modifier === '.' ? 'setDOMProp' : 'setAttr'
    }

    helperName &&
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

export function genSetDynamicProps(
  oper: SetDynamicPropsIRNode,
  context: CodegenContext,
): CodeFragment[] {
  const { call, vaporHelper } = context
  return [
    NEWLINE,
    ...call(
      vaporHelper('setDynamicProps'),
      `n${oper.element}`,
      genLiteralObjectProp(oper.value, context),
    ),
  ]
}

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
      ...oper.value.map(prop =>
        Array.isArray(prop)
          ? genLiteralObjectProp(prop, context)
          : genExpression(prop, context),
      ),
    ),
  ]
}

function genLiteralObjectProp(
  prop: DirectiveTransformResult[],
  context: CodegenContext,
): CodeFragment[] {
  const { helper } = context
  const properties: ObjectExpression['properties'] = []

  for (const { key, value, runtimeCamelize, modifier } of prop) {
    if (runtimeCamelize) {
      key.content = `${helper('camelize')}(${key.content})`
    } else if (modifier) {
      key.content = `${modifier}${key.content}`
    }
    properties.push(createObjectProperty(key, value))
  }

  return genObjectExpression(createObjectExpression(properties), context)
}
