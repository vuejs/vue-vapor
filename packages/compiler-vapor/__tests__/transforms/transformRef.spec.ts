import {
  DynamicFlag,
  type ForIRNode,
  IRNodeTypes,
  type IfIRNode,
  transformChildren,
  transformElement,
  transformRef,
  transformVFor,
  transformVIf,
} from '../../src'
import { makeCompile } from './_utils'

const compileWithTransformRef = makeCompile({
  nodeTransforms: [
    transformVIf,
    transformVFor,
    transformRef,
    transformElement,
    transformChildren,
  ],
})

describe('compiler: template ref transform', () => {
  test('static ref', () => {
    const { ir, code } = compileWithTransformRef(`<div ref="foo" />`)

    expect(code).matchSnapshot()
    expect(ir.block.dynamic.children[0]).toMatchObject({
      id: 0,
      flags: DynamicFlag.REFERENCED,
    })
    expect(ir.template).toEqual(['<div></div>'])
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.SET_REF,
        element: 0,
        value: {
          content: 'foo',
          isStatic: true,
          loc: {
            start: { line: 1, column: 10, offset: 9 },
            end: { line: 1, column: 15, offset: 14 },
          },
        },
      },
    ])
    expect(code).contains('_setRef(n0, "foo")')
  })

  test('dynamic ref', () => {
    const { ir, code } = compileWithTransformRef(`<div :ref="foo" />`)

    expect(code).matchSnapshot()
    expect(ir.block.dynamic.children[0]).toMatchObject({
      id: 0,
      flags: DynamicFlag.REFERENCED,
    })
    expect(ir.template).toEqual(['<div></div>'])
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.DECLARE_OLD_REF,
        id: 0,
      },
    ])
    expect(ir.block.effect).toMatchObject([
      {
        operations: [
          {
            type: IRNodeTypes.SET_REF,
            element: 0,
            value: {
              content: 'foo',
              isStatic: false,
            },
          },
        ],
      },
    ])
    expect(code).contains('_setRef(n0, _ctx.foo, r0)')
  })

  test('ref + v-if', () => {
    const { ir, code } = compileWithTransformRef(
      `<div ref="foo" v-if="true" />`,
    )

    expect(code).matchSnapshot()
    expect(ir.block.operation).lengthOf(1)
    expect(ir.block.operation[0].type).toBe(IRNodeTypes.IF)

    const { positive } = ir.block.operation[0] as IfIRNode
    expect(positive.operation).toMatchObject([
      {
        type: IRNodeTypes.SET_REF,
        element: 2,
        value: {
          content: 'foo',
          isStatic: true,
        },
        effect: false,
      },
    ])
    expect(code).contains('_setRef(n2, "foo")')
  })

  test('ref + v-for', () => {
    const { ir, code } = compileWithTransformRef(
      `<div ref="foo" v-for="item in [1,2,3]" />`,
    )

    expect(code).matchSnapshot()
    const { render } = ir.block.operation[0] as ForIRNode
    expect(render.operation).toMatchObject([
      {
        type: IRNodeTypes.SET_REF,
        element: 2,
        value: {
          content: 'foo',
          isStatic: true,
        },
        refFor: true,
        effect: false,
      },
    ])
    expect(code).contains('_setRef(n2, "foo", void 0, true)')
  })
})
