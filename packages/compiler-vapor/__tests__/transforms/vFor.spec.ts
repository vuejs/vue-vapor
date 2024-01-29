import { makeCompile } from './_utils'
import {
  transformElement,
  transformInterpolation,
  transformVFor,
} from '../../src'

const compileWithVFor = makeCompile({
  nodeTransforms: [transformInterpolation, transformVFor, transformElement],
})

describe('compiler: v-for', () => {
  test('basic v-for', () => {
    const { code, vaporHelpers, helpers } = compileWithVFor(
      `<div v-for="item of items">{{item}}</div>`,
    )

    expect(code).matchSnapshot()
    expect(vaporHelpers).contains('createFor')
    expect(helpers.size).toBe(0)
    // expect(ir.template).lengthOf(2)
    // expect(ir.template).toMatchObject([
    //   {
    //     template: '<div></div>',
    //     type: IRNodeTypes.TEMPLATE_FACTORY,
    //   },
    //   {
    //     type: IRNodeTypes.FRAGMENT_FACTORY,
    //   },
    // ])
    // expect(ir.operation).toMatchObject([
    //   {
    //     type: IRNodeTypes.IF,
    //     id: 1,
    //     condition: {
    //       type: NodeTypes.SIMPLE_EXPRESSION,
    //       content: 'ok',
    //       isStatic: false,
    //     },
    //     positive: {
    //       type: IRNodeTypes.BLOCK_FUNCTION,
    //       templateIndex: 0,
    //     },
    //   },
    //   {
    //     type: IRNodeTypes.APPEND_NODE,
    //     elements: [1],
    //     parent: 0,
    //   },
    // ])

    // expect(ir.dynamic).toMatchObject({
    //   id: 0,
    //   children: { 0: { id: 1 } },
    // })

    // expect(ir.effect).toEqual([])
    // expect((ir.operation[0] as IfIRNode).positive.effect).lengthOf(1)
  })
})
