import {
  type RootNode,
  BindingTypes,
  ErrorCodes,
  parse,
  NodeTypes,
} from '@vue/compiler-dom'
import {
  type CompilerOptions,
  compile as _compile,
  RootIRNode,
  transform,
  generate,
  IRNodeTypes,
} from '../../src'

import { transformVOn } from '../../src/transforms/vOn'
import { transformElement } from '../../src/transforms/transformElement'

function compileWithVHtml(
  template: string,
  options: CompilerOptions = {},
): {
  ir: RootIRNode
  code: string
} {
  const ast = parse(template, { prefixIdentifiers: true, ...options })
  const ir = transform(ast, {
    nodeTransforms: [transformElement],
    directiveTransforms: {
      on: transformVOn,
    },
    prefixIdentifiers: true,
    ...options,
  })
  const { code } = generate(ir, { prefixIdentifiers: true, ...options })
  return { ir, code }
}

describe('v-on', () => {
  test('simple expression', () => {
    const { code, ir } = compileWithVHtml(`<div @click="handleClick"></div>`, {
      bindingMetadata: {
        handleClick: BindingTypes.SETUP_CONST,
      },
    })
    console.log('ir.operation\n', ir.operation)

    expect(ir.vaporHelpers).contains('on')
    expect(ir.helpers.size).toBe(0)
    expect(ir.effect).toEqual([])

    expect(ir.operation).toMatchObject([
      {
        type: IRNodeTypes.SET_EVENT,
        element: 1,
        key: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'click',
          isStatic: true,
        },
        value: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'handleClick',
          isStatic: false,
        },
        modifiers: { keys: [], nonKeys: [], options: [] },
        keyOverride: undefined,
      },
    ])

    expect(code).matchSnapshot()
  })

  test('should error if no expression AND no modifier', () => {
    const onError = vi.fn()
    compileWithVHtml(`<div v-on:click />`, { onError })
    expect(onError.mock.calls[0][0]).toMatchObject({
      code: ErrorCodes.X_V_ON_NO_EXPRESSION,
      loc: {
        start: {
          line: 1,
          column: 6,
        },
        end: {
          line: 1,
          column: 16,
        },
      },
    })
  })

  test('event modifier', () => {
    const { code } = compileWithVHtml(
      `<a @click.stop="handleEvent"></a>
        <form @submit.prevent="handleEvent"></form>
        <a @click.stop.prevent="handleEvent"></a>
        <div @click.self="handleEvent"></div>
        <div @click.capture="handleEvent"></div>
        <a @click.once="handleEvent"></a>
        <div @scroll.passive="handleEvent"></div>
        <input @click.right="handleEvent" />
        <input @click.left="handleEvent" />
        <input @click.middle="handleEvent" />
        <input @click.enter.right="handleEvent" />
        <input @keyup.enter="handleEvent" />
        <input @keyup.tab="handleEvent" />
        <input @keyup.delete="handleEvent" />
        <input @keyup.esc="handleEvent" />
        <input @keyup.space="handleEvent" />
        <input @keyup.up="handleEvent" />
        <input @keyup.down="handleEvent" />
        <input @keyup.left="handleEvent" />
        <input @keyup.middle="submit" />
        <input @keyup.middle.self="submit" />
        <input @keyup.self.enter="handleEvent" />`,
      {
        bindingMetadata: {
          handleEvent: BindingTypes.SETUP_CONST,
        },
      },
    )
    expect(code).matchSnapshot()
  })
})
