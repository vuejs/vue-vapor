import { NodeTypes } from '@vue/compiler-core'
import {
  IRNodeTypes,
  transformChildren,
  transformElement,
  transformSlotOutlet,
  transformText,
  transformVBind,
  transformVOn,
} from '../../src'
import { makeCompile } from './_utils'

const compileWithSlotsOutlet = makeCompile({
  nodeTransforms: [
    transformText,
    transformSlotOutlet,
    transformElement,
    transformChildren,
  ],
  directiveTransforms: {
    bind: transformVBind,
    on: transformVOn,
  },
})

describe('compiler: transform <slot> outlets', () => {
  test('default slot outlet', () => {
    const { ir, code, vaporHelpers } = compileWithSlotsOutlet(`<slot />`)
    expect(code).toMatchSnapshot()
    expect(vaporHelpers).toContain('createSlot')
    expect(ir.block.effect).toEqual([])
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.SLOT_OUTLET_NODE,
        id: 0,
        name: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'default',
          isStatic: true,
        },
        props: [],
        fallback: undefined,
      },
    ])
  })

  test('statically named slot outlet', () => {
    const { ir, code } = compileWithSlotsOutlet(`<slot name="foo" />`)
    expect(code).toMatchSnapshot()
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.SLOT_OUTLET_NODE,
        id: 0,
        name: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'foo',
        },
      },
    ])
  })
})
