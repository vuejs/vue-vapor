import {
  IRNodeTypes,
  transformChildren,
  transformElement,
  transformSlotOutlet,
  transformText,
  transformVBind,
  transformVFor,
  transformVIf,
  transformVOn,
  transformVSlot,
} from '../../src'
import { makeCompile } from './_utils'

const compileWithSlots = makeCompile({
  nodeTransforms: [
    transformText,
    transformVIf,
    transformVFor,
    transformSlotOutlet,
    transformElement,
    transformVSlot,
    transformChildren,
  ],
  directiveTransforms: {
    bind: transformVBind,
    on: transformVOn,
  },
})

describe('compiler: transform slot', () => {
  test('implicit default slot', () => {
    const { ir, code } = compileWithSlots(`<Comp><div/></Comp>`)
    expect(code).toMatchSnapshot()

    expect(ir.template).toEqual(['<div></div>'])
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.CREATE_COMPONENT_NODE,
        id: 1,
        tag: 'Comp',
        props: [[]],
        slots: {
          default: {
            type: IRNodeTypes.BLOCK,
            dynamic: {
              children: [{ template: 0 }],
            },
          },
        },
      },
    ])
    expect(ir.block.returns).toEqual([1])
    expect(ir.block.dynamic).toMatchObject({
      children: [{ id: 1 }],
    })
  })

  test('named slots w/ implicit default slot', () => {
    const { ir, code } = compileWithSlots(
      `<Comp>
        <template #one>foo</template>bar<span/>
      </Comp>`,
    )
    expect(code).toMatchSnapshot()

    expect(ir.template).toEqual(['foo', 'bar', '<span></span>'])
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.CREATE_COMPONENT_NODE,
        id: 4,
        tag: 'Comp',
        props: [[]],
        slots: {
          one: {
            type: IRNodeTypes.BLOCK,
            dynamic: {
              children: [{ template: 0 }],
            },
          },
          default: {
            type: IRNodeTypes.BLOCK,
            dynamic: {
              children: [{}, { template: 1 }, { template: 2 }],
            },
          },
        },
      },
    ])
  })

  test('nested slots', () => {
    const { code } = compileWithSlots(
      `<Foo>
        <template #one><Bar><div/></Bar></template>
      </Foo>`,
    )
    expect(code).toMatchSnapshot()
  })
})
