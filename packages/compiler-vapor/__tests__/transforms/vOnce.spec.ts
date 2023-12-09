import { BindingTypes, parse } from '@vue/compiler-dom'
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

    const { code } = generate(root, { prefixIdentifiers: true })
    expect(code).toMatchSnapshot()
  })

  test('as root node', () => {
    const root = transformWithOnce(`<div :id="foo" v-once />`)

    expect(root.helpers.size).toBe(0)
    expect(root.vaporHelpers.size).toBe(0)
    expect(root.effect).toMatchObject([])
    expect(root.operation.length).toBe(1)

    expect(root.operation[0]).toMatchObject({
      type: IRNodeTypes.SET_PROP,
      element: 1,
      name: {
        type: IRNodeTypes.SET_TEXT,
        content: 'id',
        isStatic: true,
      },
      value: {
        type: IRNodeTypes.SET_TEXT,
        content: 'foo',
        isStatic: false,
      },
    })

    const { code } = generate(root, { prefixIdentifiers: true })
    expect(code).toMatchSnapshot()
  })
})
