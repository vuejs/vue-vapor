import { makeCompile } from './_utils'
import {
  IRNodeTypes,
  transformElement,
  transformVBind,
  transformVOn,
} from '../../src'
import { NodeTypes } from '@vue/compiler-core'

const compileWithElementTransform = makeCompile({
  nodeTransforms: [transformElement],
  directiveTransforms: {
    bind: transformVBind,
    on: transformVOn,
  },
})

describe('compiler: element transform', () => {
  test.todo('baisc')

  // This v-on feature comes from the unit tests of compiler-core,
  // but I am not sure if Vapor needs this feature.
  test.fails('props merging: event handlers', () => {
    const { code, ir } = compileWithElementTransform(
      `<div @click.foo="a" @click.bar="b" />`,
    )
    expect(code).toMatchSnapshot()

    expect(ir.operation).toMatchObject([
      {
        type: IRNodeTypes.SET_EVENT,
        element: 1,
        key: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'click',
          isStatic: true,
        },
        value: [
          {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: `a`,
            isStatic: false,
          },
          {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: `b`,
            isStatic: false,
          },
        ],
      },
    ])
  })

  test('props merging: style', () => {
    const { code, ir } = compileWithElementTransform(
      `<div style="color: green" :style="{ color: 'red' }" />`,
    )
    expect(code).toMatchSnapshot()

    expect(ir.effect).toMatchObject([
      {
        expressions: [
          {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: `{ color: 'red' }`,
            isStatic: false,
          },
        ],
        operations: [
          {
            type: IRNodeTypes.SET_PROP,
            element: 1,
            prop: {
              key: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: 'style',
                isStatic: true,
              },
              values: [
                {
                  type: NodeTypes.SIMPLE_EXPRESSION,
                  content: 'color: green',
                  isStatic: true,
                },
                {
                  type: NodeTypes.SIMPLE_EXPRESSION,
                  content: `{ color: 'red' }`,
                  isStatic: false,
                },
              ],
            },
          },
        ],
      },
    ])
  })

  test('props merging: class', () => {
    const { code, ir } = compileWithElementTransform(
      `<div class="foo" :class="{ bar: isBar }" />`,
    )

    expect(code).toMatchSnapshot()

    expect(ir.effect).toMatchObject([
      {
        expressions: [
          {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: `{ bar: isBar }`,
            isStatic: false,
          },
        ],
        operations: [
          {
            type: IRNodeTypes.SET_PROP,
            element: 1,
            prop: {
              key: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: 'class',
                isStatic: true,
              },
              values: [
                {
                  type: NodeTypes.SIMPLE_EXPRESSION,
                  content: `foo`,
                  isStatic: true,
                },
                {
                  type: NodeTypes.SIMPLE_EXPRESSION,
                  content: `{ bar: isBar }`,
                  isStatic: false,
                },
              ],
            },
          },
        ],
      },
    ])
  })
})
