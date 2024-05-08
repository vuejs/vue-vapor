import { createSimpleExpression } from '@vue/compiler-dom'
import {
  type CreateComponentIRNode,
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
    expect(ir.block.operation[0].type).toBe(IRNodeTypes.CREATE_COMPONENT_NODE)
    const slots = (ir.block.operation[0] as CreateComponentIRNode).slots!
    expect(slots.length).toBe(1)
    expect(slots[0].name.content).toBe('default')
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
    expect(ir.block.operation[0].type).toBe(IRNodeTypes.CREATE_COMPONENT_NODE)
    const slots = (ir.block.operation[0] as CreateComponentIRNode).slots!
    expect(slots.length).toBe(2)
    expect(slots[0].name.content).toBe('one')
    expect(slots[1].name.content).toBe('default')
  })

  test('nested slots', () => {
    const { code } = compileWithSlots(
      `<Foo>
        <template #one><Bar><div/></Bar></template>
      </Foo>`,
    )
    expect(code).toMatchSnapshot()
  })

  test('dynamic slots name', () => {
    const { ir, code } = compileWithSlots(`<Comp>
        <template #[dynamicName]>foo</template>
      </Comp>`)
    expect(ir.block.operation[0].type).toBe(IRNodeTypes.CREATE_COMPONENT_NODE)
    const slots = (ir.block.operation[0] as CreateComponentIRNode).slots!
    expect(slots.length).toBe(1)
    expect(slots[0].name.isStatic).toBe(false)
    expect(code).toMatchSnapshot()
  })
})
