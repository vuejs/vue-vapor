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
          isStatic: true,
        },
      },
    ])
  })

  test('dynamically named slot outlet', () => {
    const { ir, code } = compileWithSlotsOutlet(`<slot :name="foo + bar" />`)
    expect(code).toMatchSnapshot()
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.SLOT_OUTLET_NODE,
        id: 0,
        name: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'foo + bar',
          isStatic: false,
        },
      },
    ])
  })

  test('dynamically named slot outlet with v-bind shorthand', () => {
    const { ir, code } = compileWithSlotsOutlet(`<slot :name />`)
    expect(code).toMatchSnapshot()
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.SLOT_OUTLET_NODE,
        id: 0,
        name: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'name',
          isStatic: false,
        },
      },
    ])
  })

  test('default slot outlet with props', () => {
    const { ir, code } = compileWithSlotsOutlet(
      `<slot foo="bar" :baz="qux" :foo-bar="foo-bar" />`,
    )
    expect(code).toMatchSnapshot()
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.SLOT_OUTLET_NODE,
        name: { content: 'default' },
        props: [
          [
            { key: { content: 'foo' }, values: [{ content: 'bar' }] },
            { key: { content: 'baz' }, values: [{ content: 'qux' }] },
            { key: { content: 'fooBar' }, values: [{ content: 'foo-bar' }] },
          ],
        ],
      },
    ])
  })

  test('statically named slot outlet with props', () => {
    const { ir, code } = compileWithSlotsOutlet(
      `<slot name="foo" foo="bar" :baz="qux" />`,
    )
    expect(code).toMatchSnapshot()
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.SLOT_OUTLET_NODE,
        name: { content: 'foo' },
        props: [
          [
            { key: { content: 'foo' }, values: [{ content: 'bar' }] },
            { key: { content: 'baz' }, values: [{ content: 'qux' }] },
          ],
        ],
      },
    ])
  })

  test('statically named slot outlet with v-bind="obj"', () => {
    const { ir, code } = compileWithSlotsOutlet(
      `<slot name="foo" foo="bar" v-bind="obj" :baz="qux" />`,
    )
    expect(code).toMatchSnapshot()
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.SLOT_OUTLET_NODE,
        name: { content: 'foo' },
        props: [
          [{ key: { content: 'foo' }, values: [{ content: 'bar' }] }],
          { value: { content: 'obj', isStatic: false } },
          [{ key: { content: 'baz' }, values: [{ content: 'qux' }] }],
        ],
      },
    ])
  })

  test('statically named slot outlet with v-on', () => {
    const { ir, code } = compileWithSlotsOutlet(
      `<slot @click="foo" v-on="bar" :baz="qux" />`,
    )
    expect(code).toMatchSnapshot()
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.SLOT_OUTLET_NODE,
        props: [
          [{ key: { content: 'click' }, values: [{ content: 'foo' }] }],
          { value: { content: 'bar' }, handler: true },
          [{ key: { content: 'baz' }, values: [{ content: 'qux' }] }],
        ],
      },
    ])
  })

  test('default slot outlet with fallback', () => {
    const { ir, code } = compileWithSlotsOutlet(`<slot><div/></slot>`)
    expect(code).toMatchSnapshot()
    expect(ir.template[0]).toMatchObject('<div></div>')
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.SLOT_OUTLET_NODE,
        id: 0,
        name: { content: 'default' },
        fallback: {
          type: IRNodeTypes.BLOCK,
          dynamic: {
            children: [{ template: 0, id: 2 }],
          },
          returns: [2],
        },
      },
    ])
  })

  test('named slot outlet with fallback', () => {
    const { ir, code } = compileWithSlotsOutlet(
      `<slot name="foo"><div/></slot>`,
    )
    expect(code).toMatchSnapshot()
    expect(ir.template[0]).toMatchObject('<div></div>')
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.SLOT_OUTLET_NODE,
        id: 0,
        name: { content: 'foo' },
        fallback: {
          type: IRNodeTypes.BLOCK,
          dynamic: {
            children: [{ template: 0, id: 2 }],
          },
          returns: [2],
        },
      },
    ])
  })
})
