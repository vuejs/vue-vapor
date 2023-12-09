import { BindingTypes, NodeTypes, parse } from '@vue/compiler-dom'
import {
  type CompilerOptions,
  compile as _compile,
  transform,
  generate as generate,
  IRNodeTypes,
} from '../../src'
import { getBaseTransformPreset } from '../../src/compile'

function transformWithOnce(template: string, options: CompilerOptions = {}) {
  const ast = parse(template, {
    prefixIdentifiers: true,
    ...options,
  })
  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset(true)

  const ir = transform(ast, {
    nodeTransforms,
    directiveTransforms,
    prefixIdentifiers: true,
    ...options,
  })
  return ir
}

describe('compiler: v-once transform', () => {
  test('basic', () => {
    const root = transformWithOnce(
      `<div v-once>
        {{ msg }}
        <span :class="clz" />
      </div>`,
      {
        bindingMetadata: {
          msg: BindingTypes.SETUP_REF,
          clz: BindingTypes.SETUP_REF,
        },
      },
    )
    expect(root.helpers.size).toBe(0)
    expect(root.vaporHelpers.size).toBe(0)
    expect(root.effect).toMatchObject([])

    expect(root.operation).toMatchObject([
      {
        id: 1,
        type: IRNodeTypes.CREATE_TEXT_NODE,
        value: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'msg',
          isStatic: false,
        },
      },
      {
        element: 1,
        type: IRNodeTypes.SET_TEXT,
        value: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'msg',
          isStatic: false,
        },
      },
      {
        element: 2,
        key: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'class',
          isStatic: true,
        },
        type: IRNodeTypes.SET_PROP,
        value: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'clz',
          isStatic: false,
        },
      },
      {
        type: IRNodeTypes.PREPEND_NODE,
        elements: [1],
        parent: 3,
      },
    ])

    const { code } = generate(root, { prefixIdentifiers: true })
    expect(code).toMatchSnapshot()
  })

  test('as root node', () => {
    const root = transformWithOnce(`<div :id="foo" v-once />`)

    expect(root.helpers.size).toBe(0)
    expect(root.vaporHelpers.size).toBe(0)
    expect(root.effect).toMatchObject([])

    expect(root.operation).toMatchObject([
      {
        type: IRNodeTypes.SET_PROP,
        element: 1,
        key: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'id',
          isStatic: true,
        },
        value: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'foo',
          isStatic: false,
        },
      },
    ])

    const { code } = generate(root, { prefixIdentifiers: true })
    expect(code).toMatchSnapshot()
  })
})
