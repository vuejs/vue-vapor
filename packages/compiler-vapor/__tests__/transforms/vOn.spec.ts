import { BindingTypes, ErrorCodes, parse, NodeTypes } from '@vue/compiler-dom'
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

function compileWithVOn(
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
    const { code, ir } = compileWithVOn(`<div @click="handleClick"></div>`, {
      bindingMetadata: {
        handleClick: BindingTypes.SETUP_CONST,
      },
    })

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

  test.fails('dynamic arg', () => {
    const { code, ir } = compileWithVOn(`<div v-on:[event]="handler"/>`)

    expect(ir.vaporHelpers).contains('on')
    expect(ir.vaporHelpers).contains('effect')
    expect(ir.helpers.size).toBe(0)
    expect(ir.operation).toEqual([])

    expect(ir.effect[0].operations[0]).toMatchObject({
      type: IRNodeTypes.SET_EVENT,
      element: 1,
      key: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: 'event',
        isStatic: false,
      },
      value: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: 'handleClick',
        isStatic: false,
      },
    })

    expect(code).matchSnapshot()
  })

  test.todo('dynamic arg with prefixing')
  test.todo('dynamic arg with complex exp prefixing')
  test.todo('should wrap as function if expression is inline statement')
  test.todo('should handle multiple inline statement')
  test.todo('should handle multi-line statement')
  test.todo('inline statement w/ prefixIdentifiers: true')
  test.todo('multiple inline statements w/ prefixIdentifiers: true')
  test.todo(
    'should NOT wrap as function if expression is already function expression',
  )
  test.todo(
    'should NOT wrap as function if expression is already function expression (with Typescript)',
  )
  test.todo(
    'should NOT wrap as function if expression is already function expression (with newlines)',
  )
  test.todo(
    'should NOT wrap as function if expression is already function expression (with newlines + function keyword)',
  )
  test.todo(
    'should NOT wrap as function if expression is complex member expression',
  )
  test.todo('complex member expression w/ prefixIdentifiers: true')
  test.todo('function expression w/ prefixIdentifiers: true')

  test('should error if no expression AND no modifier', () => {
    const onError = vi.fn()
    compileWithVOn(`<div v-on:click />`, { onError })
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

  test('should NOT error if no expression but has modifier', () => {
    const onError = vi.fn()
    compileWithVOn(`<div v-on:click.prevent />`, { onError })
    expect(onError).not.toHaveBeenCalled()
  })

  test.fails('case conversion for kebab-case events', () => {
    const { ir, code } = compileWithVOn(`<div v-on:foo-bar="onMount"/>`)

    expect(ir.vaporHelpers).contains('on')
    expect(ir.helpers.size).toBe(0)
    expect(ir.effect).toEqual([])

    expect(ir.operation).toMatchObject([
      {
        type: IRNodeTypes.SET_EVENT,
        element: 1,
        key: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'onFooBar',
          isStatic: true,
        },
        value: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'onMount',
          isStatic: false,
        },
      },
    ])

    expect(code).matchSnapshot()
  })

  test.todo('')
  test.todo('')
  test.todo('')
  test.todo('')
  test.todo('')
  test.todo('')
  test.todo('')
  test.todo('')
  test.todo('')
  test.todo('')

  test('event modifier', () => {
    const { code } = compileWithVOn(
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
