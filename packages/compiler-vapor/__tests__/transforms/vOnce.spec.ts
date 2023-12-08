import { type RootNode, BindingTypes } from '@vue/compiler-dom'
import { type CompilerOptions, compile as _compile } from '../../src'

function compile(template: string | RootNode, options: CompilerOptions = {}) {
  let { code } = _compile(template, {
    ...options,
    mode: 'module',
    prefixIdentifiers: true,
  })
  return code
}

describe('v-once', () => {
  test('basic', async () => {
    const code = await compile(
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
    expect(code).matchSnapshot()
  })

  test('as root node', async () => {
    const code = await compile(`<div :id="foo" v-once />`)
    expect(code).toMatchSnapshot()
    expect(code).not.contains('effect')
  })
})
